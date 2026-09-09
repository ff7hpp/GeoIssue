# Temporary Cloud Testing Plan

## Recommended architecture

- Frontend: Vercel static Vite deployment.
- API: Google Cloud Run in `europe-west3`, request-based billing, minimum instances `0`, maximum instances `2`.
- Database: Neon PostgreSQL Free plan, using a pooled TLS connection string.
- Secrets: Google Secret Manager for `DATABASE_URL` and `JWT_SECRET`.

This is the lowest-cost reliable path for a small 5–10 day test. It provides HTTPS for the browser and does not depend on the laptop. Cold starts are expected after idle periods.

## Cost gate (checked 2026-09-09)

| Component | Expected short-test cost | Important limit |
|---|---:|---|
| Cloud Run | Usually $0 for light testing within the monthly free tier | Billing must be enabled; egress or usage above free quotas is charged |
| Cloud Build | Usually $0 within 2,500 free build-minutes/month | Extra build time and network egress can be charged |
| Artifact Registry | Usually $0 below 0.5 GiB stored | Storage above the free allowance is charged |
| Secret Manager | Usually $0 for two active versions and light access | Six active versions and 10,000 accesses/month are free |
| Neon Free | $0 | 0.5 GB storage and 100 CU-hours/project/month; compute sleeps when idle |
| Vercel Hobby | $0 for personal, non-commercial use | Company/commercial testing may require Pro ($20/month plus applicable usage/tax) |

Official pricing: [Cloud Run](https://cloud.google.com/run/pricing), [Cloud Build](https://cloud.google.com/build/pricing), [Artifact Registry](https://cloud.google.com/artifact-registry/pricing), [Secret Manager](https://cloud.google.com/secret-manager/pricing), [Neon](https://neon.com/pricing), [Vercel](https://vercel.com/pricing).

The existing terminated `geoissue-staging` VM still has a 30 GB balanced persistent disk. Starting its `e2-medium` compute for ten full days would add roughly USD 8.04 before disk/network/tax. It is not the recommended path.

## Required approval

Do not enable APIs, create registries/secrets/services, start the VM, create a paid Vercel plan, or migrate data until the owner approves the cost/risk above.

## Deployment sequence after approval

1. Create a Neon Free PostgreSQL project and keep its pooled `DATABASE_URL` private.
2. Restore the verified PostgreSQL dump into a temporary Neon branch/database.
3. Compare users, reports, issues, categories, status history, supporters, comments, and a sample of report ownership before promoting the target database.
4. Enable Cloud Run, Cloud Build, Artifact Registry, and Secret Manager APIs.
5. Create an Artifact Registry Docker repository and two Secret Manager secrets: `geoissue-database-url` and `geoissue-jwt-secret`.
6. Build the API with `deploy/cloudbuild.api.yaml`.
7. Deploy Cloud Run with public HTTPS, `NODE_ENV=production`, exact Vercel `CLIENT_ORIGIN`, minimum `0`, maximum `2`, and the two secrets pinned to versions.
8. Run `npm run migrate --prefix server` against the cloud database, then create/update the administrator with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `npm run admin:create --prefix server` from a trusted shell.
9. Import the Vercel project from branch `A`, set `VITE_API_URL=https://<cloud-run-url>/api`, and deploy.
10. Update Cloud Run `CLIENT_ORIGIN` to the final Vercel origin and verify CORS.
11. Run public health, auth/RBAC, report persistence, map, browser refresh, mobile layout, and physical-device GPS checks.

Never paste database passwords or JWT secrets into Git, build logs, screenshots, or documentation.

## Rollback

- Keep the pre-migration dump until the test is complete.
- Cloud Run: route traffic to the previous healthy revision.
- Vercel: promote the previous successful deployment.
- Database: restore the pre-migration dump into a fresh database, verify counts, then change the database secret to the restored target.

## Shutdown checklist (day 5–10)

- Export a final database dump and verify it can be listed/read.
- Disable or delete the Vercel deployment if no longer needed.
- Delete the Cloud Run service and unused container images.
- Destroy obsolete secret versions, keeping no plaintext copies.
- Delete the Neon project only after the final backup is verified.
- Keep the existing GCP VM terminated; separately decide whether its paid persistent disk is still needed.
- Confirm the GCP console shows no unexpected running compute, Cloud SQL instances, static IPs, or retained images.
