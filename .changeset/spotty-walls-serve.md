---
'@backstage/plugin-kubernetes-backend': patch
---

Fixed a bug in the Kubernetes proxy endpoint where requests to clusters configured with client-side auth providers would always fail with a 500 status.
