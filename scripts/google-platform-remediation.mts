/** Scoped maintenance. ADC only; never logs credentials. Default is read-only. */
import { mkdir, writeFile } from 'node:fs/promises';
import { google } from 'googleapis';

const mode = process.argv[2] ?? 'inspect';
if (!['inspect', 'consent', 'analytics', 'sitemap'].includes(mode)) throw new Error('Unknown mode');
if (mode !== 'inspect' && !process.argv.includes('--apply')) throw new Error('Use --apply for an authorized change');
const auth = new google.auth.GoogleAuth({ scopes: [
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  'https://www.googleapis.com/auth/tagmanager.publish',
  'https://www.googleapis.com/auth/analytics.edit',
  'https://www.googleapis.com/auth/webmasters',
] });
const gtm = google.tagmanager({ version: 'v2', auth });
const ga = google.analyticsadmin({ version: 'v1beta', auth });
const gsc = google.searchconsole({ version: 'v1', auth });
const property = 'properties/307020788';
async function backup(label: string, value: unknown) {
  await mkdir('reports', { recursive: true });
  const path = `reports/remediation-${label}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  await writeFile(path, JSON.stringify(value, null, 2));
  console.log(JSON.stringify({ backup: path }));
}
async function main() {
  if (mode === 'inspect' || mode === 'consent') {
    const accounts = (await gtm.accounts.list()).data.account ?? [];
    let found = false;
    for (const account of accounts) {
      for (const container of (await gtm.accounts.containers.list({ parent: account.path! })).data.container ?? []) {
        if (container.publicId !== 'GTM-NM5P94W8') continue;
        found = true;
        const parent = container.path!;
        const live = (await gtm.accounts.containers.versions.live({ parent })).data;
        const tags = live.tag ?? [];
        const pinterest = tags.filter((tag) => tag.type === 'pntr' && !tag.paused);
        const workspaces = (await gtm.accounts.containers.workspaces.list({ parent })).data.workspace ?? [];
        console.log(JSON.stringify({ container: parent, version: live.containerVersionId,
          pinterest: pinterest.map(({ tagId, name, consentSettings, firingTriggerId, tagFiringOption }) => ({ tagId, name, consentSettings, firingTriggerId, tagFiringOption })),
          workspaces: workspaces.map(({ path, name }) => ({ path, name })) }));
        if (mode === 'consent') {
          if (pinterest.length !== 1) throw new Error('Expected exactly one active Pinterest tag');
          await backup(`gtm-version-${live.containerVersionId}`, live);
          const workspace = (await gtm.accounts.containers.workspaces.create({ parent, requestBody: {
            name: `Consent fix ${new Date().toISOString().slice(0, 10)}`,
            description: 'User-authorized audit remediation: gate Pinterest on marketing consent. No other workspace changes.'
          } })).data;
          if (!workspace.path) throw new Error('Missing workspace path');
          const tagPath = `${workspace.path}/tags/${pinterest[0].tagId}`;
          const tag = (await gtm.accounts.containers.workspaces.tags.get({ path: tagPath })).data;
          await gtm.accounts.containers.workspaces.tags.update({ path: tagPath, fingerprint: tag.fingerprint!, requestBody: {
            ...tag, consentSettings: { consentStatus: 'needed', consentType: {
              type: 'list', list: [{ type: 'template', value: 'ad_storage' }, { type: 'template', value: 'ad_user_data' }, { type: 'template', value: 'ad_personalization' }]
            } }
          } });
          const status = (await gtm.accounts.containers.workspaces.getStatus({ path: workspace.path })).data;
          if (status.mergeConflict?.length) throw new Error('Workspace has conflicts; not publishing');
          const changes = status.workspaceChange ?? [];
          if (changes.some((change) => change.tag?.tagId !== tag.tagId)) throw new Error('Unexpected workspace change; not publishing');
          const version = (await gtm.accounts.containers.workspaces.create_version({ path: workspace.path, requestBody: {
            name: 'Require marketing consent for Pinterest', notes: 'Authorized on 2026-09-13. Only Pinterest consent requirements changed; source version ' + live.containerVersionId
          } })).data;
          if (version.compilerError || !version.containerVersion?.path) throw new Error('Version compilation failed; not publishing');
          const latest = (await gtm.accounts.containers.versions.live({ parent })).data;
          if (latest.containerVersionId !== live.containerVersionId) throw new Error('Live version changed concurrently; not publishing');
          const published = (await gtm.accounts.containers.versions.publish({ path: version.containerVersion.path })).data;
          if (published.compilerError) throw new Error('Publish compilation failed');
          const after = (await gtm.accounts.containers.versions.live({ parent })).data;
          await backup('gtm-consent-after', after);
          console.log(JSON.stringify({ publishedVersion: after.containerVersionId, consent: after.tag?.find((item) => item.tagId === tag.tagId)?.consentSettings }));
        }
      }
    }
    if (!found) throw new Error('Target GTM container not found');
  }
  if (mode === 'inspect' || mode === 'analytics') {
    const settings = (await ga.properties.get({ name: property })).data;
    const events = (await ga.properties.keyEvents.list({ parent: property })).data.keyEvents ?? [];
    const whatsapp = events.find((event) => event.eventName === 'whatsapp_click');
    console.log(JSON.stringify({ property, timeZone: settings.timeZone, currencyCode: settings.currencyCode, whatsapp }));
    if (mode === 'analytics') {
      if (!whatsapp?.name) throw new Error('WhatsApp key event missing');
      await backup('ga-settings-before', { settings, whatsapp });
      await ga.properties.patch({ name: property, updateMask: 'timeZone', requestBody: { timeZone: 'America/Sao_Paulo' } });
      await ga.properties.keyEvents.patch({ name: whatsapp.name, updateMask: 'defaultValue', requestBody: { name: whatsapp.name } });
      console.log(JSON.stringify({ after: (await ga.properties.get({ name: property })).data.timeZone, whatsapp: (await ga.properties.keyEvents.get({ name: whatsapp.name })).data }));
    }
  }
  if (mode === 'sitemap') {
    const siteUrl = 'sc-domain:byimperiodog.com.br';
    const feedpath = 'https://byimperiodog.com.br/sitemap-index.xml';
    await backup('sitemaps-before', (await gsc.sitemaps.list({ siteUrl })).data);
    await gsc.sitemaps.submit({ siteUrl, feedpath });
    console.log(JSON.stringify({ sitemaps: (await gsc.sitemaps.list({ siteUrl })).data }));
  }
}
main().catch((error) => { console.error(JSON.stringify({ error: error.response?.data?.error?.message ?? error.message, code: error.code })); process.exitCode = 1; });
