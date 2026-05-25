#!/usr/bin/env node

/**
 * PSI Validation Script
 * Testa PageSpeed Insights em URLs principais e valida SEO isolation
 */

import { writeFile } from "fs/promises";
import path from "path";

// Configuração
const DOMAIN = process.env.VERCEL_URL || process.argv[2] || "https://byimperiodog.vercel.app";
const PSI_API_KEY = process.env.PSI_API_KEY || ""; // Opcional, mas evita rate limit

const URLS = [
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog" },
  { name: "Filhotes", path: "/filhotes" },
  { name: "Sobre", path: "/sobre" },
];

const ADMIN_URLS = [
  { name: "Admin Dashboard", path: "/admin" },
  { name: "Admin Wizard", path: "/admin/cadastros/wizard" },
];

const TARGETS = {
  mobile: { performance: 95, seo: 100, accessibility: 100 },
  desktop: { performance: 100, seo: 100, accessibility: 100 },
  lcp: 2500, // ms
  cls: 0.1,
};

/**
 * Fetch PSI data
 */
async function testPSI(url, strategy = "mobile") {
  const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("strategy", strategy);
  apiUrl.searchParams.set("category", "performance");
  apiUrl.searchParams.set("category", "seo");
  apiUrl.searchParams.set("category", "accessibility");
  
  if (PSI_API_KEY) {
    apiUrl.searchParams.set("key", PSI_API_KEY);
  }

  console.log(`🔍 Testing ${strategy}: ${url}`);
  
  const response = await fetch(apiUrl.toString());
  if (!response.ok) {
    throw new Error(`PSI API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  const { lighthouseResult } = data;
  
  return {
    performance: Math.round(lighthouseResult.categories.performance.score * 100),
    seo: Math.round(lighthouseResult.categories.seo.score * 100),
    accessibility: Math.round(lighthouseResult.categories.accessibility.score * 100),
    lcp: lighthouseResult.audits["largest-contentful-paint"].numericValue,
    cls: lighthouseResult.audits["cumulative-layout-shift"].numericValue,
    fid: lighthouseResult.audits["max-potential-fid"]?.numericValue || 0,
  };
}

/**
 * Validate SEO isolation headers
 */
async function validateAdminHeaders(url) {
  console.log(`🔒 Validating headers: ${url}`);
  
  try {
    const response = await fetch(url, { method: "HEAD" });
    const robotsTag = response.headers.get("x-robots-tag");
    
    return {
      url,
      hasNoindex: robotsTag?.toLowerCase().includes("noindex"),
      robotsTag,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      url,
      hasNoindex: false,
      error: error.message,
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 PSI Validation Started");
  console.log(`📍 Domain: ${DOMAIN}\n`);

  const results = {
    timestamp: new Date().toISOString(),
    domain: DOMAIN,
    public: [],
    admin: [],
    summary: { passed: 0, failed: 0, warnings: 0 },
  };

  // Test public URLs
  console.log("📊 Testing Public URLs\n");
  for (const { name, path: urlPath } of URLS) {
    const fullUrl = `${DOMAIN}${urlPath}`;
    
    try {
      const mobile = await testPSI(fullUrl, "mobile");
      const desktop = await testPSI(fullUrl, "desktop");
      
      const passed =
        mobile.performance >= TARGETS.mobile.performance &&
        desktop.performance >= TARGETS.desktop.performance &&
        mobile.lcp <= TARGETS.lcp &&
        mobile.cls <= TARGETS.cls;
      
      results.public.push({
        name,
        url: fullUrl,
        mobile,
        desktop,
        passed,
      });
      
      if (passed) {
        results.summary.passed++;
        console.log(`✅ ${name}: PASSED`);
      } else {
        results.summary.failed++;
        console.log(`❌ ${name}: FAILED`);
      }
      
      console.log(`   Mobile: ${mobile.performance} | Desktop: ${desktop.performance} | LCP: ${Math.round(mobile.lcp)}ms | CLS: ${mobile.cls.toFixed(3)}\n`);
      
      // Rate limit protection
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error testing ${name}:`, error.message);
      results.summary.failed++;
    }
  }

  // Validate admin SEO isolation
  console.log("\n🔒 Validating Admin SEO Isolation\n");
  for (const { name, path: urlPath } of ADMIN_URLS) {
    const fullUrl = `${DOMAIN}${urlPath}`;
    
    try {
      const headerCheck = await validateAdminHeaders(fullUrl);
      results.admin.push(headerCheck);
      
      if (headerCheck.hasNoindex) {
        console.log(`✅ ${name}: noindex header confirmed`);
      } else {
        console.log(`⚠️  ${name}: Missing noindex header!`);
        results.summary.warnings++;
      }
    } catch (error) {
      console.error(`❌ Error validating ${name}:`, error.message);
      results.summary.warnings++;
    }
  }

  // Generate report
  const reportPath = path.join(process.cwd(), "reports", "psi-validation-latest.json");
  await writeFile(reportPath, JSON.stringify(results, null, 2), "utf-8");
  
  console.log(`\n📄 Report saved: ${reportPath}`);
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 VALIDATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${results.summary.passed}/${URLS.length}`);
  console.log(`❌ Failed: ${results.summary.failed}/${URLS.length}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  
  if (results.summary.failed === 0 && results.summary.warnings === 0) {
    console.log("\n🎉 ALL TESTS PASSED!");
    process.exit(0);
  } else {
    console.log("\n⚠️  SOME TESTS FAILED OR WARNINGS PRESENT");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
