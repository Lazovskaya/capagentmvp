# LLM-judge rubric — TS-<scenario-id>

TEMPLATE rubric. Replace the dimensions below with the quality criteria that matter
for this component. The judge scores the produced output against the source input,
in a separate fresh context, seeing only the input + the output + this rubric.

Score each dimension on an integer scale **1-5** (5 = best). Give a one-sentence
reason BEFORE the score (reason-before-score).

## Dimensions

1. **<Grounding> (1-5).** <Does the free-text justification cite the actual values
   from the input, not generic statements? 5 = every claim traces to a real value;
   1 = vague or invents data not in the input.>

2. **<Defensibility> (1-5).** <Given the input, is the main decision reasonable and
   internally consistent (decision matches its own justification/score)? 5 =
   consistent and evidence-based; 1 = contradicts the evidence.>

3. **<Relevance> (1-5).** <Are the recommendations/next actions concrete and
   consistent with the decision, not boilerplate? 5 = specific and actionable;
   1 = generic or contradicts the decision.>

## Output (return exactly this, as a fenced JSON block)

```json
{
  "grounding": { "reason": "<one sentence>", "score": 0 },
  "defensibility": { "reason": "<one sentence>", "score": 0 },
  "relevance": { "reason": "<one sentence>", "score": 0 },
  "overall_comment": "<one sentence>"
}
```

## Pass threshold

Level-3 passes when the average of the three scores is >= `judge_pass_threshold`
AND no single dimension scores below `judge_min_dimension` (both set in
`scenario.config.md`).

> NOTE: the judge JSON keys (`grounding`, `defensibility`, `relevance`) are read by
> `judge.py`. If you rename dimensions, keep these three keys or update `judge.py`
> accordingly.
