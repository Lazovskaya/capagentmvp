# EVAL FIXTURE — billing AR prod

**id:** INC-EVAL-2002  
**text:** Billing document created in prod but accounting document not created. Error points at account determination / period. Month-end.  
**triage:**
- sub_process: ar
- layer: config
- severity: S1
- confidence: medium
- diagnose_handoff: billing-ar-error-analyzer
- dup_group_size: 2
- environment: prod
- flags: prod-posting, period-close
