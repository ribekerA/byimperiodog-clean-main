export const dynamic = "force-dynamic";
﻿import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { computeCoverage } from "@/lib/topicClusters";

interface CacheEntry {
  ts: number;
  data: unknown;
}
const TTL_MS = 10_000;
let cache: CacheEntry | null = null;

type LeadRow = {
  id: string;
  created_at: string;
  utm_source?: string | null;
  source?: string | null;
  status?: string | null;
};
type ContractRow = { id: string; status?: string | null; created_at: string };
type PuppyRow = { id: string; status?: string | null };
type PostRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  created_at: string | null;
  published_at: string | null;
  scheduled_at?: string | null;
  author_id?: string | null;
  category?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  cover_url?: string | null;
  og_image_url?: string | null;
};
type AiSessionRow = {
  id: string;
  topic: string;
  status: string;
  phase: string;
  progress: number;
  created_at: string;
  updated_at: string;
};
type AiTaskRow = {
  id: string;
  topic: string | null;
  result?: unknown;
  status: string;
  progress: number;
  phase?: string | null;
  created_at: string;
  finished_at?: string | null;
};
type CommentRow = {
  id: string;
  post_id: string | null;
  author_name: string | null;
  body: string | null;
  created_at: string;
};
type ScheduleEventRow = {
  id: string;
  post_id: string | null;
  run_at: string;
  action: string;
  payload?: unknown;
  executed_at?: string | null;
};
type RevisionRow = {
  id: string;
  post_id: string | null;
  created_at: string;
  created_by: string | null;
};
type AuthorRow = {
  id: string;
  name: string;
  avatar_url?: string | null;
};

const MAX_LIST_ITEMS = 6;

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) {
    return NextResponse.json(cache.data);
  }

  const url = new URL(req.url);
  const rangeParam = url.searchParams.get("range");
  const range = ["7", "30", "90"].includes(String(rangeParam))
    ? Number(rangeParam)
    : 30;

  const supa = supabaseAdmin();
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - range);
  const dKey = (d: Date) => d.toISOString().slice(0, 10);

  const { data: leads, error: leadsErr } = await supa
    .from("leads")
    .select("id,created_at,utm_source,source,status")
    .gte("created_at", start.toISOString());
  if (leadsErr) {
    return NextResponse.json(
      { ok: false, error: leadsErr.message },
      { status: 500 },
    );
  }

  const leadsByDay = new Map<string, number>();
  const leadsBySource = new Map<string, number>();
  const leadStatuses: Record<string, number> = {};
  const todayKey = dKey(end);
  let leadsToday = 0;
  (leads as LeadRow[] | null | undefined)?.forEach((lead) => {
    const key = dKey(new Date(lead.created_at));
    leadsByDay.set(key, (leadsByDay.get(key) || 0) + 1);
    const source = (lead.utm_source || lead.source || "direct").toLowerCase();
    leadsBySource.set(source, (leadsBySource.get(source) || 0) + 1);
    const statusKey = (lead.status || "novo").toLowerCase();
    leadStatuses[statusKey] = (leadStatuses[statusKey] || 0) + 1;
    if (key === todayKey) leadsToday += 1;
  });

  const seriesDays = Math.min(30, range);
  const leadSeries: number[] = [];
  for (let i = seriesDays - 1; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(end.getDate() - i);
    leadSeries.push(leadsByDay.get(dKey(day)) || 0);
  }

  const { data: contracts, error: contractsErr } = await supa
    .from("contracts")
    .select("id,status,created_at")
    .gte("created_at", start.toISOString());
  if (contractsErr) {
    console.error("dashboard metrics contracts", contractsErr.message);
  }
  const contractRows = (contracts as ContractRow[] | null) || [];
  const contractStatus = contractRows.reduce((acc, contract) => {
    const statusKey = (contract.status || "pendente").toLowerCase();
    acc[statusKey] = (acc[statusKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const leadCount = leads?.length || 0;
  const conversion = leadCount
    ? Math.round((contractRows.length / leadCount) * 100)
    : 0;

  const { data: puppies } = await supa
    .from("puppies")
    .select("id,status");
  const puppyStatus = (puppies as PuppyRow[] | null | undefined)?.reduce(
    (acc, pup) => {
      const status = (pup.status || "desconhecido").toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  ) || {};

  const { data: recentLeads } = await supa
    .from("leads")
    .select("id,created_at,utm_source,source,status")
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: posts } = await supa
    .from("blog_posts")
    .select(
      "id,slug,title,status,created_at,published_at,scheduled_at,author_id,category,seo_title,seo_description,cover_url,og_image_url",
    )
    .order("created_at", { ascending: false })
    .limit(2000);
  const postsArr = (posts || []) as PostRow[];
  const publishedPosts = postsArr.filter((post) => post.status === "published");

  const publishSeries: number[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(end.getDate() - i);
    const key = dKey(day);
    publishSeries.push(
      publishedPosts.filter(
        (post) => post.published_at && post.published_at.slice(0, 10) === key,
      ).length,
    );
  }

  const contentStatus = postsArr.reduce((acc, post) => {
    const statusKey = post.status || "desconhecido";
    acc[statusKey] = (acc[statusKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryCounts = postsArr.reduce((acc, post) => {
    if (!post.category) return acc;
    const key = post.category.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const categoryBreakdown = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_LIST_ITEMS)
    .map(([category, count]) => ({ category, count }));

  const reviewQueue = postsArr
    .filter((post) => post.status === "review" || post.status === "scheduled")
    .sort((a, b) => {
      const aDate = a.scheduled_at || a.created_at || "";
      const bDate = b.scheduled_at || b.created_at || "";
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    })
    .slice(0, MAX_LIST_ITEMS)
    .map((post) => ({
      id: post.id,
      title: post.title,
      status: post.status,
      scheduled_at: post.scheduled_at,
      slug: post.slug,
    }));

  const authorIds = Array.from(
    new Set(postsArr.map((post) => post.author_id).filter(Boolean) as string[]),
  );
  let authorLeaderboard: { id: string; name: string; avatar_url?: string | null; posts: number }[] = [];
  if (authorIds.length) {
    const { data: authorRows, error: authorErr } = await supa
      .from("blog_authors")
      .select("id,name,avatar_url")
      .in("id", authorIds);
    if (authorErr) {
      console.error("dashboard metrics authors", authorErr.message);
    }
    const authorCounts = postsArr.reduce((acc, post) => {
      if (!post.author_id) return acc;
      acc[post.author_id] = (acc[post.author_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    authorLeaderboard = ((authorRows || []) as AuthorRow[])
      .map((author) => ({
        id: author.id,
        name: author.name,
        avatar_url: author.avatar_url,
        posts: authorCounts[author.id] || 0,
      }))
      .sort((a, b) => b.posts - a.posts)
      .slice(0, MAX_LIST_ITEMS);
  }

  const coverage = computeCoverage(
    postsArr.map((post) => ({
      slug: post.slug,
      title: post.title,
      status: post.status,
    })),
  );

  const latestPosts = postsArr
    .slice(0, 50)
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
    )
    .slice(0, 8)
    .map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      status: post.status,
      published_at: post.published_at,
    }));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(end.getDate() - 7);
  const { count: pageViewsCount } = await supa
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .gte("ts", sevenDaysAgo.toISOString())
    .eq("name", "web_vitals_lcp");
  const interactionNames = ["card_click", "toc_click", "share_click"];
  const { count: interactionsCount } = await supa
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .gte("ts", sevenDaysAgo.toISOString())
    .in("name", interactionNames as any);
  const ctrRatio = Math.round(
    ((interactionsCount || 0) / Math.max(1, pageViewsCount || 0)) * 100,
  );

  const avgPerDay = Math.round(
    leadSeries.reduce((acc, value) => acc + value, 0) / Math.max(1, leadSeries.length),
  );
  const yesterday = new Date();
  yesterday.setDate(end.getDate() - 1);
  const yesterdayKey = dKey(yesterday);
  const leadsYesterday = leadsByDay.get(yesterdayKey) || 0;
  const deltaToday = leadsYesterday
    ? Math.round(((leadsToday - leadsYesterday) / leadsYesterday) * 100)
    : leadsToday > 0
    ? 100
    : 0;
  const topSources = [...leadsBySource.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([src, count]) => ({
      src,
      count,
      pct: leadCount ? Math.round((count / leadCount) * 100) : 0,
    }));

  const metadataIssues = postsArr
    .filter((post) => ["published", "review"].includes(post.status))
    .map((post) => {
      const missing: string[] = [];
      if (!post.seo_title) missing.push("seo_title");
      if (!post.seo_description) missing.push("seo_description");
      if (!post.cover_url) missing.push("cover_url");
      if (!post.og_image_url) missing.push("og_image_url");
      return missing.length
        ? {
            id: post.id,
            slug: post.slug,
            title: post.title,
            status: post.status,
            missing,
          }
        : null;
    })
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);

  const sevenDaysIso = sevenDaysAgo.toISOString();
  const { count: aiActiveCount } = await supa
    .from("ai_generation_sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  const { count: aiErrorCount } = await supa
    .from("ai_generation_sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "error");
  const { count: aiCompleted7d } = await supa
    .from("ai_generation_sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("updated_at", sevenDaysIso);
  const { data: aiLatest } = await supa
    .from("ai_generation_sessions")
    .select("id,topic,status,phase,progress,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: aiTasksData } = await supa
    .from("ai_tasks")
    .select("id,topic,status,progress,phase,created_at,finished_at,result")
    .order("created_at", { ascending: false })
    .limit(MAX_LIST_ITEMS);
  const aiTasksByStatus = (aiTasksData as AiTaskRow[] | null | undefined)?.reduce(
    (acc, task) => {
      const key = (task.status || "pending").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  ) || {};
  const aiTasksRecent = (aiTasksData as AiTaskRow[] | null | undefined)?.map((task) => ({
    id: task.id,
    topic: task.topic,
    status: task.status,
    progress: task.progress,
    phase: task.phase,
    created_at: task.created_at,
    finished_at: task.finished_at,
  })) || [];

  const { data: aiResearchIdeas } = await supa
    .from("ai_tasks")
    .select("id,topic,result,created_at")
    .eq("type", "research")
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(5);

  const ideas = (aiResearchIdeas as AiTaskRow[] | null | undefined)?.map(
    (task) => {
      const payload =
        task.result && typeof task.result === "object"
          ? (task.result as Record<string, unknown>)
          : {};
      const primary = String(payload.primary_keyword || task.topic || "").trim();
      const angle = String(payload.angle || "").trim();
      return {
        id: task.id,
        topic: task.topic || primary || "",
        primary_keyword: primary,
        angle,
        created_at: task.created_at,
      };
    },
  ) || [];

  const seoInsights = {
    coverage: {
      percent: coverage.percent,
      covered: coverage.covered,
      total: coverage.total,
      missingCount: coverage.missing.length,
      missingTitles: coverage.missing.slice(0, MAX_LIST_ITEMS),
    },
    missingMeta: {
      total: metadataIssues.length,
      items: metadataIssues,
    },
    aiSessions: {
      active: aiActiveCount || 0,
      error: aiErrorCount || 0,
      completed7d: aiCompleted7d || 0,
      latest:
        (aiLatest as AiSessionRow[] | null | undefined)?.map((session) => ({
          id: session.id,
          topic: session.topic,
          status: session.status,
          phase: session.phase,
          progress: session.progress,
          updated_at: session.updated_at,
          created_at: session.created_at,
        })) || [],
      ideas,
    },
  };

  const { data: scheduleEventsData } = await supa
    .from("blog_post_schedule_events")
    .select("id,post_id,run_at,action,payload,executed_at")
    .is("executed_at", null)
    .order("run_at", { ascending: true })
    .limit(MAX_LIST_ITEMS);
  const upcomingEvents = (scheduleEventsData as ScheduleEventRow[] | null | undefined)?.map((event) => ({
    id: event.id,
    post_id: event.post_id,
    run_at: event.run_at,
    action: event.action,
    post_title: postsArr.find((post) => post.id === event.post_id)?.title || null,
  })) || [];

  const { data: commentsData } = await supa
    .from("blog_comments")
    .select("id,post_id,author_name,body,created_at")
    .eq("approved", false)
    .order("created_at", { ascending: false })
    .limit(MAX_LIST_ITEMS);
  const pendingComments = (commentsData as CommentRow[] | null | undefined)?.map((comment) => ({
    id: comment.id,
    post_id: comment.post_id,
    author_name: comment.author_name,
    excerpt: (comment.body || '').slice(0, 140),
    created_at: comment.created_at,
    post_title: postsArr.find((post) => post.id === comment.post_id)?.title || null,
  })) || [];

  const { data: revisionsData } = await supa
    .from("blog_post_revisions")
    .select("id,post_id,created_at,created_by")
    .order("created_at", { ascending: false })
    .limit(MAX_LIST_ITEMS);
  const recentRevisions = (revisionsData as RevisionRow[] | null | undefined)?.map((revision) => ({
    id: revision.id,
    post_id: revision.post_id,
    created_at: revision.created_at,
    created_by: revision.created_by,
    post_title: postsArr.find((post) => post.id === revision.post_id)?.title || null,
  })) || [];

  const payload = {
    ok: true,
    range,
    leadsHoje: leadsToday,
    deltaHoje: deltaToday,
    leadsCount: leadCount,
    leadStatus: leadStatuses,
    conversao: conversion,
    series: leadSeries,
    mediaDia: avgPerDay,
    topFontes: topSources,
    recent: recentLeads || [],
    pupStatus: puppyStatus,
    contratos: contractRows.length,
    contractStatus,
    postsCount: posts?.length || 0,
    postsPublished: publishedPosts.length,
    publishSeries,
    contentStatus,
    reviewQueue,
    authorLeaderboard,
    categoryBreakdown,
    coverage: {
      percent: coverage.percent,
      covered: coverage.covered,
      total: coverage.total,
      missingCount: coverage.missing.length,
    },
    latestPosts,
    ctr: {
      ratio: ctrRatio,
      interactions: interactionsCount || 0,
      pageViews: pageViewsCount || 0,
    },
    seoInsights,
    aiTasks: {
      byStatus: aiTasksByStatus,
      recent: aiTasksRecent,
    },
    upcomingEvents,
    pendingComments,
    recentRevisions,
  };

  cache = { ts: now, data: payload };
  return NextResponse.json(payload);
}
