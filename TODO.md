# TODO

## CRITICAL

- **Single EC2 instance, no Auto Scaling Group — no automatic recovery if the instance dies.**
  Deploy currently targets a fixed EC2 instance ID via SSM Run Command
  (`scripts/deploy/ec2-redeploy.sh`, `docs/DEPLOYMENT.md`). If that instance fails outright
  (not just the container — the VM itself), there's no automated replacement; recovery
  depends on someone noticing and fixing it manually, which could take hours.
  Fix: move to an Auto Scaling Group with `min=1/max=1/desired=1` — no extra AWS cost
  (you pay for the same single instance either way), but requires updating the deploy
  script to target the ASG instead of a fixed instance ID, and handling the IP change on
  instance replacement (Elastic IP re-association, or a health-check-based DNS update in
  Cloudflare) since the current setup assumes a static IP. See `decisions/decisions.md`
  (2026-08-13 entry) for the full reasoning.
