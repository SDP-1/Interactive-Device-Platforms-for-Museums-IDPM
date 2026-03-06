"""
Museum AI Systems — Comprehensive Model Evaluation
===================================================
Run from 'Basii Full Component/' directory:

    python evaluate_all_models.py

What it evaluates:
  1. T5 Artifact Explainer  — ROUGE-L score vs reference text, inference latency
  2. Sentence Transformer   — Top-1/Top-3 retrieval accuracy, within/between category
                              cosine similarity, silhouette clustering score
  3. RAG Scenario System    — Response quality (ROUGE-L vs pre-written answers),
                              latency, token efficiency (requires port 5001 running)

Output: model_evaluation_report.html  (open in any browser)
"""

import os, sys, json, time, pickle, warnings, math, datetime
import numpy as np
warnings.filterwarnings("ignore")

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
ART_DIR     = os.path.join(BASE_DIR, "Atifact_Comparison_Component")
SCEN_DIR    = os.path.join(BASE_DIR, "Scenario_Generation")
REPORT_PATH = os.path.join(BASE_DIR, "model_evaluation_report.html")

print("=" * 65)
print("  MUSEUM AI SYSTEMS — MODEL EVALUATION")
print(f"  {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 65)

# ─────────────────────────────────────────────────────────────────
# ROUGE-L helper (no external library required)
# ─────────────────────────────────────────────────────────────────
def _lcs(a, b):
    m, n = len(a), len(b)
    # Use only O(n) space
    prev = [0] * (n + 1)
    for i in range(1, m + 1):
        curr = [0] * (n + 1)
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                curr[j] = prev[j - 1] + 1
            else:
                curr[j] = max(prev[j], curr[j - 1])
        prev = curr
    return prev[n]

def rouge_l(hypothesis: str, reference: str) -> float:
    h = hypothesis.lower().split()
    r = reference.lower().split()
    if not h or not r:
        return 0.0
    lcs = _lcs(h, r)
    p = lcs / len(h)
    rec = lcs / len(r)
    if p + rec == 0:
        return 0.0
    return 2 * p * rec / (p + rec)


# ─────────────────────────────────────────────────────────────────
# 1. T5 ARTIFACT EXPLAINER
# ─────────────────────────────────────────────────────────────────
def evaluate_t5():
    print("\n[1/3] Evaluating T5 Artifact Explainer...")
    result = {"status": "not_tested", "metrics": {}}

    t5_path   = os.path.join(ART_DIR, "t5_artifact_explainer")
    meta_path = os.path.join(ART_DIR, "trained_model", "artifact_metadata.json")

    if not os.path.exists(t5_path):
        result.update({"status": "model_not_found",
                        "error": "T5 model directory not found at " + t5_path})
        print("  SKIPPED — T5 model directory not found")
        return result

    try:
        # Windows DLL fix for PyTorch
        if sys.platform == "win32":
            try:
                import importlib.util
                spec = importlib.util.find_spec("torch")
                if spec and spec.submodule_search_locations:
                    tp = spec.submodule_search_locations[0]
                    for sub in ("lib", "bin"):
                        p = os.path.join(tp, sub)
                        if os.path.exists(p):
                            os.add_dll_directory(p)
            except Exception:
                pass

        from transformers import T5ForConditionalGeneration, T5Tokenizer
        import torch

        print("   Loading T5 tokenizer and model (this may take ~30s)...")
        tokenizer = T5Tokenizer.from_pretrained(t5_path)
        model     = T5ForConditionalGeneration.from_pretrained(t5_path)
        model.eval()

        with open(meta_path, "r", encoding="utf-8") as f:
            artifacts = json.load(f)["artifacts"]

        # Test on up to 6 artifacts
        test_artifacts = artifacts[:6]

        def expected_text(a):
            return (
                f"{a['name']} {a['category']} {a['origin']} {a['era']} "
                f"{a['function']} {a['symbolism']} {a['notes']}"
            )

        def run_one(a):
            inp = (
                f"Explain this artifact: {a['name']} | "
                f"Category: {a['category']} | Origin: {a['origin']} | "
                f"Era: {a['era']} | Materials: {a['materials']} | "
                f"Function: {a['function']} | Symbolism: {a['symbolism']} | "
                f"Notes: {a['notes']}"
            )
            input_ids = tokenizer.encode(
                inp, return_tensors="pt", max_length=512, truncation=True
            )
            t0 = time.time()
            with torch.no_grad():
                out = model.generate(input_ids, max_length=512,
                                     num_beams=2, early_stopping=True)
            latency = time.time() - t0
            generated = tokenizer.decode(out[0], skip_special_tokens=True)
            score = rouge_l(generated, expected_text(a))
            return score, latency, generated[:120]

        scores, latencies, per_artifact = [], [], []
        for i, a in enumerate(test_artifacts):
            s, lat, preview = run_one(a)
            scores.append(s)
            latencies.append(lat)
            per_artifact.append({
                "artifact": a["name"],
                "rouge_l":  round(s,   4),
                "latency_s": round(lat, 2),
                "output_preview": preview
            })
            print(f"   [{i+1}/{len(test_artifacts)}] {a['name'][:35]:<35} "
                  f"ROUGE-L={s:.3f}  Time={lat:.2f}s")

        result = {
            "status": "ok",
            "metrics": {
                "avg_rouge_l":      round(float(np.mean(scores)), 4),
                "min_rouge_l":      round(float(np.min(scores)),  4),
                "max_rouge_l":      round(float(np.max(scores)),  4),
                "avg_latency_s":    round(float(np.mean(latencies)), 2),
                "artifacts_tested": len(scores),
                "per_artifact":     per_artifact
            }
        }
        print(f"   ✅  Avg ROUGE-L={result['metrics']['avg_rouge_l']:.3f}  "
              f"Avg Latency={result['metrics']['avg_latency_s']:.2f}s")

    except Exception as e:
        result.update({"status": "error", "error": str(e)})
        print(f"   ❌  Error: {e}")

    return result


# ─────────────────────────────────────────────────────────────────
# 2. SENTENCE TRANSFORMER — SIMILARITY & RETRIEVAL
# ─────────────────────────────────────────────────────────────────
def evaluate_sentence_transformer():
    print("\n[2/3] Evaluating Sentence Transformer (Similarity Model)...")
    result = {"status": "not_tested", "metrics": {}}

    emb_path  = os.path.join(ART_DIR, "trained_model", "artifact_embeddings.pkl")
    meta_path = os.path.join(ART_DIR, "trained_model", "artifact_metadata.json")

    if not os.path.exists(emb_path):
        result.update({"status": "model_not_found",
                        "error": "artifact_embeddings.pkl not found"})
        print("  SKIPPED — Embeddings file not found")
        return result

    try:
        from sklearn.metrics.pairwise import cosine_similarity
        from sklearn.metrics import silhouette_score

        with open(emb_path, "rb") as f:
            emb_data   = pickle.load(f)
        embeddings = emb_data["embeddings"]
        clusters   = emb_data.get("clusters")

        with open(meta_path, "r", encoding="utf-8") as f:
            artifacts = json.load(f)["artifacts"]

        n = len(artifacts)
        print(f"   Loaded {n} artifacts, embedding shape {embeddings.shape}")

        # Full cosine similarity matrix
        sim_matrix = cosine_similarity(embeddings)

        categories = [a["category"] for a in artifacts]
        ids        = [a["id"]       for a in artifacts]
        id_to_idx  = {a["id"]: i   for i, a in enumerate(artifacts)}

        def paired_id(aid):
            """Return expected cross-cultural counterpart: A001 <-> C001"""
            if aid.startswith("A"):  return "C" + aid[1:]
            if aid.startswith("C"):  return "A" + aid[1:]
            return None

        correct1, correct3 = 0, 0
        paired_tested      = 0
        within, between    = [], []

        for i in range(n):
            row = sim_matrix[i].copy()
            row[i] = -1
            ranked = np.argsort(row)[::-1]

            # Cross-cultural pairing accuracy
            expected_pair = paired_id(ids[i])
            if expected_pair and expected_pair in id_to_idx:
                paired_tested += 1
                if ids[ranked[0]] == expected_pair:
                    correct1 += 1
                if any(ids[ranked[k]] == expected_pair for k in range(min(3, n - 1))):
                    correct3 += 1

            for j in range(i + 1, n):
                bucket = within if categories[i] == categories[j] else between
                bucket.append(sim_matrix[i][j])

        denom = paired_tested if paired_tested > 0 else 1
        acc1  = correct1 / denom
        acc3  = correct3 / denom
        avg_within  = float(np.mean(within))  if within  else 0.0
        avg_between = float(np.mean(between)) if between else 0.0
        upper_tri   = sim_matrix[np.triu_indices(n, k=1)]
        avg_all     = float(np.mean(upper_tri))

        silhouette = None
        if clusters is not None and len(set(clusters)) > 1:
            try:
                silhouette = round(float(silhouette_score(embeddings, clusters)), 4)
            except Exception:
                pass

        # Category separation ratio: how much better is within vs between
        separation = round((avg_within - avg_between) / max(avg_between, 1e-6), 4)

        result = {
            "status": "ok",
            "metrics": {
                "top1_pairing_accuracy":            round(acc1, 4),
                "top3_pairing_accuracy":            round(acc3, 4),
                "paired_artifacts_tested":          paired_tested,
                "avg_within_category_similarity":   round(avg_within,  4),
                "avg_between_category_similarity":  round(avg_between, 4),
                "avg_all_pairs_similarity":         round(avg_all, 4),
                "category_separation_ratio":        separation,
                "silhouette_score":                 silhouette,
                "total_artifacts":                  n,
                "embedding_dimensions":             int(embeddings.shape[1]) if embeddings.ndim > 1 else None
            }
        }
        print(f"   ✅  Top-1 Cross-Cultural Pairing Accuracy: {acc1:.1%}")
        print(f"   ✅  Top-3 Cross-Cultural Pairing Accuracy: {acc3:.1%}")
        print(f"   ✅  Within-Category Similarity : {avg_within:.3f}")
        print(f"   ✅  Between-Category Similarity: {avg_between:.3f}")
        if silhouette is not None:
            print(f"   ✅  Silhouette Score          : {silhouette:.3f}")

    except Exception as e:
        result.update({"status": "error", "error": str(e)})
        print(f"   ❌  Error: {e}")

    return result


# ─────────────────────────────────────────────────────────────────
# 3. RAG SCENARIO SYSTEM
# ─────────────────────────────────────────────────────────────────
def evaluate_rag():
    print("\n[3/3] Evaluating RAG Scenario System (port 5001)...")
    result = {"status": "not_tested", "metrics": {}}

    try:
        import requests

        # Probe server
        try:
            r = requests.get("http://localhost:5001/health", timeout=4)
            server_up   = r.status_code == 200
            server_info = r.json() if server_up else {}
        except Exception:
            server_up   = False
            server_info = {}

        if not server_up:
            result.update({
                "status": "server_not_running",
                "message": (
                    "Scenario backend (port 5001) is not running. "
                    "Start it via run_system.py, then re-run this script "
                    "to include live RAG evaluation."
                )
            })
            print("   SKIPPED — Scenario backend not running (start run_system.py first)")
            return result

        print(f"   Server online. Model: {server_info.get('model','?')}  "
              f"Fine-tuned: {server_info.get('fine_tuned','?')}")

        # Load test cases from dataset CSV
        import csv
        csv_path   = os.path.join(SCEN_DIR, "dataset", "Dataset - Sheet1.csv")
        test_cases = []

        if os.path.exists(csv_path):
            with open(csv_path, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    raw_q = row.get("Pre_written examples (What-If Questions)", "")
                    raw_a = row.get("pre_written_answers", "")
                    if not raw_q or not raw_a:
                        continue
                    first_q = next(
                        (ln.strip().lstrip("1. ") for ln in raw_q.splitlines() if ln.strip()),
                        ""
                    )
                    if first_q:
                        test_cases.append({
                            "artid":     row.get("artifact_id", "ART001").lower(),
                            "reference": raw_a[:600]
                        })
                    if len(test_cases) >= 4:
                        break

        if not test_cases:
            test_cases = [{
                "artid":     "art001",
                "reference": (
                    "The British first attacked Kandy in 1803. "
                    "Disease and local resistance forced their retreat. "
                    "British political influence grew through collaboration with Kandyan chiefs."
                )
            }]

        scores, latencies, per_query = [], [], []
        for i, tc in enumerate(test_cases):
            t0 = time.time()
            try:
                resp = requests.post(
                    "http://localhost:5001/api/generate",
                    json={
                        "artid":       tc["artid"].lower(),
                        "scenario_id": "historical_impact"
                    },
                    timeout=60
                )
                lat = time.time() - t0
                if resp.status_code == 200:
                    data   = resp.json()
                    # Combine all 3 description fields into one text for ROUGE
                    answer = " ".join([
                        data.get("answerDescription1", ""),
                        data.get("answerDescription2", ""),
                        data.get("answerDescription3", "")
                    ])
                    score  = rouge_l(answer, tc["reference"])
                    tokens = data.get("tokens_used", 0)
                    scores.append(score)
                    latencies.append(lat)
                    per_query.append({
                        "artifact":  tc["artid"],
                        "rouge_l":   round(score, 4),
                        "latency_s": round(lat, 2),
                        "tokens":    tokens
                    })
                    print(f"   [{i+1}/{len(test_cases)}] Artifact={tc['artid']}  "
                          f"ROUGE-L={score:.3f}  Time={lat:.2f}s  Tokens={tokens}")
            except Exception as qe:
                print(f"   [{i+1}] Query failed: {qe}")

        if scores:
            result = {
                "status": "ok",
                "metrics": {
                    "avg_rouge_l":   round(float(np.mean(scores)), 4),
                    "avg_latency_s": round(float(np.mean(latencies)), 2),
                    "avg_tokens":    round(float(np.mean([q.get("tokens", 0) for q in per_query]))),
                    "queries_tested": len(scores),
                    "model":          server_info.get("model", "Unknown"),
                    "fine_tuned":     server_info.get("fine_tuned", False),
                    "per_query":      per_query
                }
            }
            print(f"   ✅  Avg ROUGE-L={result['metrics']['avg_rouge_l']:.3f}  "
                  f"Avg Tokens={result['metrics']['avg_tokens']}")
        else:
            result.update({"status": "no_results", "error": "All queries failed"})

    except Exception as e:
        result.update({"status": "error", "error": str(e)})
        print(f"   ❌  Error: {e}")

    return result


# ─────────────────────────────────────────────────────────────────
# 4. HTML REPORT GENERATOR
# ─────────────────────────────────────────────────────────────────
def build_report(t5_res, st_res, rag_res, run_ts):

    def safe(d, key, fallback="N/A"):
        v = d.get("metrics", {}).get(key, None)
        if v is None:
            return fallback
        return v

    def fmt_pct(v):
        try:
            return f"{float(v)*100:.1f}%"
        except Exception:
            return str(v)

    def color(v, good, warn):
        try:
            f = float(v)
            if f >= good:  return "#22c55e"
            if f >= warn:  return "#f59e0b"
            return "#ef4444"
        except Exception:
            return "#94a3b8"

    def badge(v, good, warn):
        try:
            f = float(v)
            if f >= good:  return ("GOOD",  "#22c55e")
            if f >= warn:  return ("FAIR",  "#f59e0b")
            return ("NEEDS IMPROVEMENT", "#ef4444")
        except Exception:
            return ("NOT TESTED", "#94a3b8")

    # ─── Section builders ───
    def status_pill(res):
        s = res.get("status", "not_tested")
        colours = {
            "ok":                 ("#d1fae5", "#065f46", "Evaluated"),
            "server_not_running": ("#fef3c7", "#92400e", "Server Offline"),
            "model_not_found":    ("#fee2e2", "#991b1b", "Model Not Found"),
            "error":              ("#fee2e2", "#991b1b", "Error"),
            "not_tested":         ("#f1f5f9", "#334155", "Not Tested"),
        }
        bg, fg, label = colours.get(s, ("#f1f5f9", "#334155", s.replace("_", " ").title()))
        return (
            f'<span style="background:{bg};color:{fg};padding:3px 12px;'
            f'border-radius:9999px;font-size:0.75rem;font-weight:600;">{label}</span>'
        )

    def metric_card(label, value_str, unit, col, bdg_text, bdg_col, desc):
        return f"""
        <div class="metric-card">
          <div class="m-label">{label}</div>
          <div class="m-value" style="color:{col}">{value_str}
            <span class="m-unit">&nbsp;{unit}</span>
          </div>
          <div class="m-badge" style="background:{bdg_col}22;color:{bdg_col};">{bdg_text}</div>
          <div class="m-desc">{desc}</div>
        </div>"""

    # ── T5 card content ──
    t5_status  = status_pill(t5_res)
    t5_avg_rl  = safe(t5_res, "avg_rouge_l")
    t5_lat     = safe(t5_res, "avg_latency_s")
    t5_n       = safe(t5_res, "artifacts_tested", 0)
    t5_bdg, t5_c = badge(t5_avg_rl, 0.40, 0.20)

    t5_per_rows = ""
    if t5_res.get("status") == "ok":
        for pa in t5_res["metrics"].get("per_artifact", []):
            c = color(pa["rouge_l"], 0.40, 0.20)
            t5_per_rows += (
                f'<tr><td>{pa["artifact"]}</td>'
                f'<td style="color:{c};font-weight:600">{pa["rouge_l"]}</td>'
                f'<td>{pa["latency_s"]}s</td>'
                f'<td class="preview">{pa.get("output_preview","")[:80]}…</td></tr>\n'
            )

    t5_table = ""
    if t5_per_rows:
        t5_table = f"""
        <table>
          <thead><tr><th>Artifact</th><th>ROUGE-L</th><th>Time</th><th>Output Preview</th></tr></thead>
          <tbody>{t5_per_rows}</tbody>
        </table>"""

    t5_error_msg = (
        f'<p class="error-msg">⚠ {t5_res.get("error", t5_res.get("message",""))} </p>'
        if t5_res.get("status") not in ("ok", "not_tested") else ""
    )

    t5_metrics_html = ""
    if t5_res.get("status") == "ok":
        t5_metrics_html = (
            metric_card("Avg ROUGE-L", t5_avg_rl, "", t5_c, t5_bdg, t5_c,
                        "Overlap between generated and reference text. &ge;0.40 is publication-quality.")
            + metric_card("Avg Inference Time", t5_lat, "sec", color(1/max(float(t5_lat or 99), 0.1), 1/2, 1/5),
                          *badge(1 - min(float(t5_lat or 99)/5, 1), 0.6, 0.2),
                          "Cold-start generation time. Museum kiosk target &lt;3s.")
            + metric_card("Artifacts Tested", t5_n, "", "#6366f1", "INFO", "#6366f1",
                          "Number of artifacts used for this evaluation run.")
        )
    # ── Sentence Transformer card content ──
    st_status = status_pill(st_res)
    st_acc1   = safe(st_res, "top1_pairing_accuracy")
    st_acc3   = safe(st_res, "top3_pairing_accuracy")
    st_win    = safe(st_res, "avg_within_category_similarity")
    st_bet    = safe(st_res, "avg_between_category_similarity")
    st_sil    = safe(st_res, "silhouette_score")
    st_n      = safe(st_res, "total_artifacts", 0)

    st_error_msg = (
        f'<p class="error-msg">⚠ {st_res.get("error", st_res.get("message",""))}</p>'
        if st_res.get("status") not in ("ok", "not_tested") else ""
    )

    st_metrics_html = ""
    st_paired_n = safe(st_res, "paired_artifacts_tested", 0)
    if st_res.get("status") == "ok":
        acc1_bdg, acc1_c = badge(st_acc1, 0.65, 0.40)
        acc3_bdg, acc3_c = badge(st_acc3, 0.80, 0.60)
        win_bdg,  win_c  = badge(st_win,  0.65, 0.45)
        sil_bdg,  sil_c  = badge(st_sil or 0, 0.30, 0.10)
        sep_val = safe(st_res, "category_separation_ratio")

        st_metrics_html = (
            metric_card("Cross-Cultural Pairing Accuracy (Top-1)", fmt_pct(st_acc1), "", acc1_c, acc1_bdg, acc1_c,
                        f"Given an artifact (e.g. Kandyan Sword), is the top-1 result its cross-cultural counterpart (e.g. Japanese Katana)? &ge;65% is good. Tested on {st_paired_n} pairs.")
            + metric_card("Cross-Cultural Pairing Accuracy (Top-3)", fmt_pct(st_acc3), "", acc3_c, acc3_bdg, acc3_c,
                          "Is the correct cross-cultural pair in the top-3 results? &ge;80% is good.")
            + metric_card("Within-Category Similarity", st_win, "", win_c, win_bdg, win_c,
                          "Average cosine similarity between same-type artifacts (e.g. sword vs sword). Higher = model understands artifact types.")
            + metric_card("Between-Category Similarity", st_bet, "", color(1 - float(st_bet or 0), 0.6, 0.4),
                          *badge(1 - float(st_bet or 0), 0.6, 0.4),
                          "Average similarity across different artifact types. Lower = better separation between drums, swords, murals, etc.")
            + metric_card("Silhouette Score", st_sil if st_sil is not None else "N/A", "", sil_c, sil_bdg, sil_c,
                          "Cluster cohesion score (−1 to +1). &ge;0.30 = well-separated clusters. Note: small dataset (30 artifacts) naturally limits this score.")
            + metric_card("Category Separation Ratio", sep_val, "×", "#6366f1", "INFO", "#6366f1",
                          "(Within − Between) ÷ Between. Shows how much more similar same-type artifacts are compared to cross-type.")
        )

    # ── RAG card content ──
    rag_status = status_pill(rag_res)
    rag_rl     = safe(rag_res, "avg_rouge_l")
    rag_lat    = safe(rag_res, "avg_latency_s")
    rag_tok    = safe(rag_res, "avg_tokens")
    rag_n      = safe(rag_res, "queries_tested", 0)
    rag_model  = safe(rag_res, "model", "—")
    rag_ft     = safe(rag_res, "fine_tuned", False)

    rag_error_msg = ""
    if rag_res.get("status") == "server_not_running":
        rag_error_msg = f'<p class="warn-msg">ℹ {rag_res.get("message","")}</p>'
    elif rag_res.get("status") not in ("ok", "not_tested"):
        rag_error_msg = f'<p class="error-msg">⚠ {rag_res.get("error","")}</p>'

    rag_per_rows = ""
    if rag_res.get("status") == "ok":
        for pq in rag_res["metrics"].get("per_query", []):
            c = color(pq["rouge_l"], 0.35, 0.20)
            rag_per_rows += (
                f'<tr><td>{pq.get("artifact", pq.get("question","—"))}</td>'
                f'<td style="color:{c};font-weight:600">{pq["rouge_l"]}</td>'
                f'<td>{pq["latency_s"]}s</td>'
                f'<td>{pq.get("tokens","—")}</td></tr>\n'
            )

    rag_table = ""
    if rag_per_rows:
        rag_table = f"""
        <table>
          <thead><tr><th>Artifact / Scenario</th><th>ROUGE-L</th><th>Time</th><th>Tokens</th></tr></thead>
          <tbody>{rag_per_rows}</tbody>
        </table>"""

    rag_metrics_html = ""
    if rag_res.get("status") == "ok":
        rl_bdg, rl_c   = badge(rag_rl,  0.35, 0.20)
        tok_bdg, tok_c = badge(1 - min(float(rag_tok or 9999) / 1500, 1), 0.6, 0.4)
        rag_metrics_html = (
            metric_card("Avg ROUGE-L", rag_rl, "", rl_c, rl_bdg, rl_c,
                        "Overlap between RAG response and pre-written reference answers. &ge;0.35 is good for open-ended generation.")
            + metric_card("Avg Response Time", rag_lat, "sec", color(1/max(float(rag_lat or 99),0.1), 1/5, 1/15),
                          *badge(1 - min(float(rag_lat or 99)/15, 1), 0.6, 0.2),
                          "End-to-end response latency. Museum kiosk target &lt;10s.")
            + metric_card("Avg Token Usage", rag_tok, "tokens", tok_c, tok_bdg, tok_c,
                          "Tokens consumed per API call. &lt;800 is efficient; &gt;1500 is expensive.")
            + metric_card("Queries Tested", rag_n, "", "#6366f1", "INFO", "#6366f1",
                          f"Model: {rag_model}  |  Fine-tuned: {'Yes' if rag_ft else 'No'}")
        )

    # ── Bar chart data ──
    chart_labels = json.dumps([
        "T5 ROUGE-L", "Pairing Acc Top-1", "Pairing Acc Top-3",
        "Within-Cat Sim", "RAG ROUGE-L"
    ])
    def safe_float(v, default=0.0):
        try:    return round(float(v), 4)
        except: return default

    chart_values = json.dumps([
        safe_float(t5_avg_rl),
        safe_float(st_acc1),
        safe_float(st_acc3),
        safe_float(st_win),
        safe_float(rag_rl),
    ])
    chart_thresholds = json.dumps([0.40, 0.65, 0.80, 0.65, 0.35])
    chart_colors = json.dumps([
        color(t5_avg_rl, 0.40, 0.20),
        color(st_acc1,   0.70, 0.50),
        color(st_acc3,   0.85, 0.65),
        color(st_win,    0.65, 0.45),
        color(rag_rl,    0.35, 0.20),
    ])

    HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Model Accuracy Evaluation — Museum AI Systems</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'Inter', sans-serif;
    background: #f8fafc;
    color: #1e293b;
    min-height: 100vh;
  }}
  /* ─── HEADER ─── */
  .page-header {{
    background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
    color: #fff;
    padding: 2.5rem 3rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }}
  .page-header h1 {{ font-size: 1.6rem; font-weight: 700; letter-spacing: -0.5px; }}
  .page-header p  {{ font-size: 0.88rem; color: #94a3b8; margin-top: 4px; }}
  .header-badge {{
    background: #f97316;
    color: #fff;
    padding: 6px 18px;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 600;
  }}
  /* ─── LAYOUT ─── */
  .container {{ max-width: 1300px; margin: 0 auto; padding: 2rem 2rem 4rem; }}
  /* ─── SUMMARY BAR ─── */
  .summary-bar {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }}
  .summary-tile {{
    background: #fff;
    border-radius: 12px;
    padding: 1.2rem 1.5rem;
    box-shadow: 0 1px 4px rgba(0,0,0,.07);
    border-left: 4px solid transparent;
  }}
  .summary-tile .tile-val {{
    font-size: 1.8rem;
    font-weight: 700;
  }}
  .summary-tile .tile-label {{
    font-size: 0.78rem;
    color: #64748b;
    margin-top: 2px;
  }}
  /* ─── CHART ─── */
  .chart-section {{
    background: #fff;
    border-radius: 14px;
    padding: 1.8rem 2rem;
    box-shadow: 0 1px 4px rgba(0,0,0,.07);
    margin-bottom: 2rem;
  }}
  .chart-section h2 {{ font-size: 1rem; font-weight: 600; margin-bottom: 1.2rem; color:#334155; }}
  .chart-wrap {{ position: relative; height: 240px; }}
  /* ─── MODEL SECTION ─── */
  .model-section {{
    background: #fff;
    border-radius: 14px;
    padding: 2rem;
    box-shadow: 0 1px 4px rgba(0,0,0,.07);
    margin-bottom: 1.5rem;
  }}
  .model-header {{
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }}
  .model-icon {{
    width: 48px; height: 48px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem;
    flex-shrink: 0;
  }}
  .model-title  {{ font-size: 1.15rem; font-weight: 700; }}
  .model-sub    {{ font-size: 0.82rem; color: #64748b; margin-top: 3px; }}
  /* ─── METRICS GRID ─── */
  .metrics-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.9rem;
    margin-bottom: 1.2rem;
  }}
  .metric-card {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.9rem 1rem;
  }}
  .m-label {{ font-size: 0.73rem; font-weight: 500; color: #64748b; text-transform: uppercase;
              letter-spacing: 0.04em; margin-bottom: 4px; }}
  .m-value  {{ font-size: 1.35rem; font-weight: 700; }}
  .m-unit   {{ font-size: 0.75rem; font-weight: 400; color: #94a3b8; }}
  .m-badge  {{ display: inline-block; font-size: 0.68rem; font-weight: 600;
               padding: 2px 9px; border-radius: 9999px; margin: 5px 0 6px; }}
  .m-desc   {{ font-size: 0.73rem; color: #64748b; line-height: 1.4; }}
  /* ─── TABLE ─── */
  table {{ width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 0.8rem; }}
  th {{ background: #f1f5f9; text-align: left; padding: 8px 12px;
        font-size: 0.72rem; color: #475569; text-transform: uppercase;
        letter-spacing: 0.04em; border-bottom: 1px solid #e2e8f0; }}
  td {{ padding: 7px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: top; }}
  tr:last-child td {{ border-bottom: none; }}
  .preview {{ color: #64748b; font-style: italic; max-width: 320px; }}
  /* ─── REFERENCE ─── */
  .reference-section {{
    background: #fff;
    border-radius: 14px;
    padding: 2rem;
    box-shadow: 0 1px 4px rgba(0,0,0,.07);
    margin-bottom: 1.5rem;
  }}
  .reference-section h2 {{ font-size: 1rem; font-weight: 600; color:#334155; margin-bottom:1rem; }}
  .ref-table td:first-child {{ font-weight: 500; width: 180px; }}
  .ref-table td:nth-child(3) {{ width: 90px; text-align:center; }}
  /* ─── MESSAGES ─── */
  .error-msg {{ background:#fee2e2; color:#991b1b; padding:10px 14px;
                border-radius:8px; font-size:0.82rem; margin-bottom:1rem; }}
  .warn-msg  {{ background:#fef3c7; color:#92400e; padding:10px 14px;
                border-radius:8px; font-size:0.82rem; margin-bottom:1rem; }}
  /* ─── FOOTER ─── */
  footer {{ text-align:center; font-size:0.78rem; color:#94a3b8; margin-top:3rem; }}
</style>
</head>
<body>

<div class="page-header">
  <div>
    <h1>🏛 Museum AI Systems — Model Accuracy Report</h1>
    <p>Evaluated: {run_ts} &nbsp;|&nbsp; Interactive Device Platforms for Museums (IDPM)</p>
  </div>
  <span class="header-badge">Research Evaluation</span>
</div>

<div class="container">

  <!-- SUMMARY BAR -->
  <div class="summary-bar">
    <div class="summary-tile" style="border-color:#6366f1">
      <div class="tile-val" style="color:#6366f1">3</div>
      <div class="tile-label">AI Models Evaluated</div>
    </div>
    <div class="summary-tile" style="border-color:{color(t5_avg_rl,0.40,0.20)}">
      <div class="tile-val" style="color:{color(t5_avg_rl,0.40,0.20)}">{t5_avg_rl}</div>
      <div class="tile-label">T5 Avg ROUGE-L Score</div>
    </div>
    <div class="summary-tile" style="border-color:{color(st_acc1,0.65,0.40)}">
      <div class="tile-val" style="color:{color(st_acc1,0.65,0.40)}">{fmt_pct(st_acc1)}</div>
      <div class="tile-label">Cross-Cultural Pairing Acc.</div>
    </div>
    <div class="summary-tile" style="border-color:{color(rag_rl,0.35,0.20)}">
      <div class="tile-val" style="color:{color(rag_rl,0.35,0.20)}">{rag_rl}</div>
      <div class="tile-label">RAG Avg ROUGE-L Score</div>
    </div>
  </div>

  <!-- CHART -->
  <div class="chart-section">
    <h2>Key Metrics Overview (all scores normalised 0 → 1)</h2>
    <div class="chart-wrap">
      <canvas id="metricsChart"></canvas>
    </div>
  </div>

  <!-- ───────── T5 MODEL ───────── -->
  <div class="model-section">
    <div class="model-header">
      <div class="model-icon" style="background:#fef3c7">🤖</div>
      <div style="flex:1">
        <div class="model-title">T5 Artifact AI Explainer &nbsp; {t5_status}</div>
        <div class="model-sub">
          Model: T5-base fine-tuned on {t5_n} museum artifacts &nbsp;|&nbsp;
          Architecture: T5ForConditionalGeneration (8-bit quantized) &nbsp;|&nbsp;
          Metric: ROUGE-L vs expected structured explanation
        </div>
      </div>
    </div>
    {t5_error_msg}
    <div class="metrics-grid">
      {t5_metrics_html}
    </div>
    {t5_table}
  </div>

  <!-- ───────── SENTENCE TRANSFORMER ───────── -->
  <div class="model-section">
    <div class="model-header">
      <div class="model-icon" style="background:#ede9fe">🔍</div>
      <div style="flex:1">
        <div class="model-title">Sentence Transformer — Similarity Engine &nbsp; {st_status}</div>
        <div class="model-sub">
          Model: all-MiniLM-L6-v2 &nbsp;|&nbsp;
          Artifacts: {st_n} &nbsp;|&nbsp;
          Embedding dims: {safe(st_res, "embedding_dimensions", "384")} &nbsp;|&nbsp;
          Metric: Cosine similarity, retrieval accuracy, silhouette score
        </div>
      </div>
    </div>
    {st_error_msg}
    <div class="metrics-grid">
      {st_metrics_html}
    </div>
  </div>

  <!-- ───────── RAG SYSTEM ───────── -->
  <div class="model-section">
    <div class="model-header">
      <div class="model-icon" style="background:#d1fae5">💬</div>
      <div style="flex:1">
        <div class="model-title">RAG Scenario Generator &nbsp; {rag_status}</div>
        <div class="model-sub">
          Model: {rag_model} &nbsp;|&nbsp;
          Fine-tuned: {"Yes" if rag_ft else "No"} &nbsp;|&nbsp;
          Vector DB: ChromaDB &nbsp;|&nbsp;
          Metric: ROUGE-L vs pre-written reference answers, response latency, token efficiency
        </div>
      </div>
    </div>
    {rag_error_msg}
    <div class="metrics-grid">
      {rag_metrics_html}
    </div>
    {rag_table}
  </div>

  <!-- ───────── REFERENCE TABLE ───────── -->
  <div class="reference-section">
    <h2>📊 Metric Interpretation Guide</h2>
    <table class="ref-table">
      <thead>
        <tr>
          <th>Metric</th><th>What it measures</th><th>Good</th><th>Fair</th><th>Needs Work</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>ROUGE-L</td><td>Longest common subsequence overlap between generated and reference text</td>
          <td style="color:#22c55e;font-weight:600">&ge; 0.40</td>
          <td style="color:#f59e0b;font-weight:600">0.20–0.40</td>
          <td style="color:#ef4444;font-weight:600">&lt; 0.20</td></tr>
        <tr><td>Cross-Cultural Pairing Acc. (Top-1)</td><td>Top-1 nearest neighbour is the correct cross-cultural counterpart (e.g. Kandyan Sword → Japanese Katana)</td>
          <td style="color:#22c55e;font-weight:600">&ge; 65%</td>
          <td style="color:#f59e0b;font-weight:600">40–65%</td>
          <td style="color:#ef4444;font-weight:600">&lt; 40%</td></tr>
        <tr><td>Cross-Cultural Pairing Acc. (Top-3)</td><td>Correct cross-cultural pair appears in any of the top-3 results</td>
          <td style="color:#22c55e;font-weight:600">&ge; 80%</td>
          <td style="color:#f59e0b;font-weight:600">60–80%</td>
          <td style="color:#ef4444;font-weight:600">&lt; 60%</td></tr>
        <tr><td>Within-Category Similarity</td><td>Cosine similarity between same-type artifacts</td>
          <td style="color:#22c55e;font-weight:600">&ge; 0.65</td>
          <td style="color:#f59e0b;font-weight:600">0.45–0.65</td>
          <td style="color:#ef4444;font-weight:600">&lt; 0.45</td></tr>
        <tr><td>Silhouette Score</td><td>Cluster quality: how well clusters are separated (−1 to +1)</td>
          <td style="color:#22c55e;font-weight:600">&ge; 0.30</td>
          <td style="color:#f59e0b;font-weight:600">0.10–0.30</td>
          <td style="color:#ef4444;font-weight:600">&lt; 0.10</td></tr>
        <tr><td>Token Usage</td><td>API tokens consumed per RAG query</td>
          <td style="color:#22c55e;font-weight:600">&lt; 800</td>
          <td style="color:#f59e0b;font-weight:600">800–1500</td>
          <td style="color:#ef4444;font-weight:600">&gt; 1500</td></tr>
      </tbody>
    </table>
  </div>

</div><!-- /container -->

<footer>
  Generated by evaluate_all_models.py &nbsp;|&nbsp; {run_ts} &nbsp;|&nbsp;
  Interactive Device Platforms for Museums — Research Project
</footer>

<script>
const ctx = document.getElementById('metricsChart').getContext('2d');
const labels = {chart_labels};
const values = {chart_values};
const thresholds = {chart_thresholds};
const barColors = {chart_colors};

new Chart(ctx, {{
  type: 'bar',
  data: {{
    labels: labels,
    datasets: [
      {{
        label: 'Achieved',
        data: values,
        backgroundColor: barColors.map(c => c + '99'),
        borderColor: barColors,
        borderWidth: 2,
        borderRadius: 6,
      }},
      {{
        label: 'Target Threshold',
        data: thresholds,
        type: 'line',
        borderColor: '#94a3b8',
        borderWidth: 1.5,
        borderDash: [5, 4],
        backgroundColor: 'transparent',
        pointRadius: 4,
        pointBackgroundColor: '#94a3b8',
        tension: 0,
      }}
    ]
  }},
  options: {{
    responsive: true,
    maintainAspectRatio: false,
    plugins: {{
      legend: {{ position: 'top', labels: {{ font: {{ size: 12 }} }} }},
      tooltip: {{
        callbacks: {{
          label: ctx => {{
            const v = ctx.parsed.y;
            return ctx.dataset.label + ': ' + (ctx.datasetIndex === 0
              ? (v >= 1 ? v : (v * 100).toFixed(1) + (v <= 1 ? '' : ''))
              : v);
          }}
        }}
      }}
    }},
    scales: {{
      y: {{
        min: 0,
        max: 1,
        ticks: {{ callback: v => (v * 100).toFixed(0) + '%', font: {{ size: 11 }} }},
        grid: {{ color: '#f1f5f9' }}
      }},
      x: {{ ticks: {{ font: {{ size: 11 }} }}, grid: {{ display: false }} }}
    }}
  }}
}});
</script>
</body>
</html>"""
    return HTML


# ─────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    run_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    t5_res = evaluate_t5()
    st_res = evaluate_sentence_transformer()
    rag_res = evaluate_rag()

    print("\n" + "=" * 65)
    print("  Generating HTML report...")

    html = build_report(t5_res, st_res, rag_res, run_ts)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"  ✅  Report saved:  {REPORT_PATH}")
    print("=" * 65)

    # Also save raw JSON for reference
    json_path = os.path.join(BASE_DIR, "model_evaluation_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "run_timestamp": run_ts,
            "t5":                  t5_res,
            "sentence_transformer": st_res,
            "rag":                 rag_res
        }, f, indent=2, default=str)
    print(f"  ✅  Raw results:   {json_path}")

    # Try to auto-open in browser
    try:
        import webbrowser
        webbrowser.open(f"file:///{REPORT_PATH.replace(os.sep, '/')}")
        print("  ✅  Opened in browser automatically")
    except Exception:
        print("  ℹ  Open model_evaluation_report.html in your browser to view")

    print("=" * 65 + "\n")
