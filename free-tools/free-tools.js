/* CFO CRAFT Free Tools — ONE shared frontend file for five tools.
   Calculator formulas retained from the supplied HTML.  No backend logic here.
   Load with <script src="free-tools.js" defer></script> on each tool page.
*/
(() => {
  'use strict';
  const calculators = {
  "working-capital-calculator": function () {

      const $ = (id) => document.getElementById(id);
      const num = (id) => {
        const v = parseFloat($(id).value);
        return Number.isFinite(v) ? v : 0;
      };
      const fmt = (v, d = 2) =>
        Number.isFinite(v)
          ? v.toLocaleString("en-IN", {
              minimumFractionDigits: d,
              maximumFractionDigits: d,
            })
          : "—";

      function calc() {
        const rev = num("rev"),
          cogs = num("cogs"),
          inv = num("inv"),
          rec = num("rec"),
          pay = num("pay"),
          rate = num("rate") / 100;
        const err = $("err"),
          ids = [
            "o_ccc",
            "o_dio",
            "o_dso",
            "o_dpo",
            "o_ccc2",
            "o_nwc",
            "o_carry",
            "o_rel",
            "o_save",
            "o_new",
          ];
        if (rev <= 0 || cogs <= 0) {
          err.textContent =
            "Enter revenue and cost of goods sold greater than zero to calculate the cycle.";
          err.classList.add("on");
          ids.forEach((i) => ($(i).textContent = "—"));
          $("o_ccc_sub").textContent = "";
          $("o_note").textContent = "";
          return;
        }
        err.classList.remove("on");
        const dio = (inv / cogs) * 365,
          dso = (rec / rev) * 365,
          dpo = (pay / cogs) * 365,
          ccc = dio + dso - dpo;
        const nwc = inv + rec - pay,
          carry = Math.max(nwc, 0) * rate;
        const cDso = Math.min(num("cut_dso"), dso),
          cDio = Math.min(num("cut_dio"), dio),
          eDpo = num("ext_dpo");
        const rel = (cDso * rev) / 365 + ((cDio + eDpo) * cogs) / 365,
          save = rel * rate,
          nccc = ccc - cDso - cDio - eDpo;
        $("o_ccc").textContent = fmt(ccc, 1);
        $("o_ccc2").textContent = fmt(ccc, 1) + " days";
        $("o_dio").textContent = fmt(dio, 1) + " days";
        $("o_dso").textContent = fmt(dso, 1) + " days";
        $("o_dpo").textContent = "(" + fmt(dpo, 1) + " days)";
        $("o_nwc").textContent = fmt(nwc);
        $("o_carry").textContent = fmt(carry);
        $("o_rel").textContent = fmt(rel);
        $("o_save").textContent = fmt(save);
        $("o_new").textContent = fmt(nccc, 1) + " days";
        $("o_ccc_sub").textContent =
          "Each day of the cycle ties up about ₹" +
          fmt(cogs / 365, 2) +
          " lakh of cost.";
        const notes = [];
        if (dpo + eDpo > 45)
          notes.push(
            "Payable days are above 45. If any of these creditors are micro or small enterprises, check the MSMED Act payment limit and the tax disallowance explained below.",
          );
        if (num("cut_dso") > dso || num("cut_dio") > dio)
          notes.push(
            "A reduction was larger than the current days, so it has been capped at the current figure.",
          );
        if (nwc < 0)
          notes.push(
            "Payables exceed inventory plus receivables, so suppliers are funding operations. Carrying cost is shown as zero.",
          );
        $("o_note").textContent = notes.join(" ");
      }
      document
        .querySelectorAll("input")
        .forEach((i) => i.addEventListener("input", calc));
      calc();

      (function () {
        const a = document.querySelector(".tools-strip [aria-current]");
        if (a) {
          const c = a.parentElement;
          c.scrollLeft = a.offsetLeft - (c.clientWidth - a.offsetWidth) / 2;
        }
      })();
    
  },
  "monthly-cash-flow-model": function () {

      const $ = (id) => document.getElementById(id);
      const num = (id) => {
        const v = parseFloat($(id).value);
        return Number.isFinite(v) ? v : 0;
      };
      const fmt = (v, d = 2) =>
        Number.isFinite(v)
          ? v.toLocaleString("en-IN", {
              minimumFractionDigits: d,
              maximumFractionDigits: d,
            })
          : "—";

      const MONTHS = [
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];
      const EX = {
        dom: [330, 340, 355, 360, 350, 365, 380, 390, 370, 375, 385, 420],
        exp: [40, 35, 45, 40, 50, 45, 40, 55, 50, 45, 50, 60],
        oth: [0, 0, 5, 0, 0, 10, 0, 0, 5, 0, 0, 15],
        sup: [212, 218, 226, 230, 224, 236, 244, 250, 238, 242, 248, 270],
        sal: [55, 55, 55, 56, 56, 56, 76, 58, 58, 58, 58, 60],
        ovh: [30, 30, 31, 31, 31, 32, 32, 32, 32, 33, 33, 33],
        gst: [18, 19, 20, 21, 20, 21, 22, 23, 22, 22, 23, 25],
        tax: [6, 6, 36, 6, 6, 66, 6, 6, 66, 6, 6, 56],
        emi: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
        int: [9, 9, 9, 10, 10, 10, 10, 10, 9, 9, 9, 9],
        cap: [0, 0, 0, 120, 0, 0, 0, 0, 0, 0, 40, 0],
        drw: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30],
      };
      const IN = [
        ["dom", "Domestic collections"],
        ["exp", "Export collections"],
        ["oth", "Other receipts"],
      ];
      const OUT = [
        ["sup", "Supplier payments"],
        ["sal", "Salaries and wages"],
        ["ovh", "Rent, power and overheads"],
        ["gst", "GST, net payment"],
        ["tax", "Advance tax and TDS"],
        ["emi", "Term-loan EMI"],
        ["int", "CC/OD interest"],
        ["cap", "Capital expenditure"],
        ["drw", "Drawings or dividend"],
      ];
      let D = JSON.parse(JSON.stringify(EX));
      function build() {
        let h =
          '<thead><tr><th scope="col" style="text-align:left;position:sticky;left:0;z-index:2">₹ lakh</th>' +
          MONTHS.map((m) => '<th scope="col">' + m + "</th>").join("") +
          '<th scope="col">FY total</th></tr></thead><tbody>';
        const sec = (t) =>
          '<tr class="sec"><th scope="rowgroup" colspan="1">' +
          t +
          "</th>" +
          "<td></td>".repeat(13) +
          "</tr>";
        const inrow = (k, l) =>
          '<tr><th scope="row">' +
          l +
          "</th>" +
          MONTHS.map(
            (m, i) =>
              '<td><input type="number" inputmode="decimal" min="0" required step="any" data-k="' +
              k +
              '" data-m="' +
              i +
              '" aria-label="' +
              l +
              ", " +
              m +
              '" value="' +
              D[k][i] +
              '"></td>',
          ).join("") +
          '<td class="calc" id="t_' +
          k +
          '"></td></tr>';
        const crow = (id, l, cls) =>
          '<tr class="' +
          (cls || "") +
          '"><th scope="row">' +
          l +
          "</th>" +
          MONTHS.map(
            (m, i) => '<td class="calc" id="' + id + "_" + i + '"></td>',
          ).join("") +
          '<td class="calc" id="' +
          id +
          '_t"></td></tr>';
        h +=
          sec("Receipts") +
          IN.map((r) => inrow(r[0], r[1])).join("") +
          crow("rin", "Total receipts", "tot");
        h +=
          sec("Payments") +
          OUT.map((r) => inrow(r[0], r[1])).join("") +
          crow("pout", "Total payments", "tot");
        h +=
          crow("net", "Net cash flow", "tot") +
          crow("op", "Opening cash") +
          crow("cl", "Closing cash", "close") +
          crow("st", "Status");
        $("cf").innerHTML = h + "</tbody>";
      }
      function setv(id, v) {
        const e = $(id);
        e.textContent = fmt(v, 0);
        e.classList.toggle("neg", v < 0);
      }
      function calc() {
        const buf = num("buf");
        let bal = num("open");
        const close = [];
        let tin = 0,
          tout = 0,
          nt = 0,
          ns = 0,
          low = Infinity,
          lowm = "";
        [...IN, ...OUT].forEach(
          ([k]) =>
            ($("t_" + k).textContent = fmt(
              D[k].reduce((a, b) => a + b, 0),
              0,
            )),
        );
        for (let i = 0; i < 12; i++) {
          const r = IN.reduce((s, [k]) => s + D[k][i], 0),
            p = OUT.reduce((s, [k]) => s + D[k][i], 0),
            n = r - p,
            c = bal + n;
          setv("rin_" + i, r);
          setv("pout_" + i, p);
          setv("net_" + i, n);
          setv("op_" + i, bal);
          setv("cl_" + i, c);
          const st =
            c < 0
              ? ["short", "Shortfall"]
              : c < buf
                ? ["tight", "Tight"]
                : ["ok", "OK"];
          $("st_" + i).innerHTML =
            '<span class="flag ' + st[0] + '">' + st[1] + "</span>";
          if (c < 0) ns++;
          else if (c < buf) nt++;
          if (c < low) {
            low = c;
            lowm = MONTHS[i];
          }
          tin += r;
          tout += p;
          close.push(c);
          bal = c;
        }
        setv("rin_t", tin);
        setv("pout_t", tout);
        setv("net_t", tin - tout);
        $("op_t").textContent = "";
        $("cl_t").textContent = "";
        $("st_t").textContent = "";
        $("o_low").textContent = fmt(low, 0);
        $("o_lowm").textContent = "Month-end " + lowm;
        $("o_rin").textContent = fmt(tin, 0);
        $("o_pout").textContent = fmt(tout, 0);
        $("o_net").textContent = fmt(tin - tout, 0);
        $("o_close").textContent = fmt(close[11], 0);
        $("o_tight").textContent = nt;
        $("o_short").textContent = ns;
        let note = "";
        if (ns > 0)
          note =
            "Cash goes negative in " +
            ns +
            " month" +
            (ns > 1 ? "s" : "") +
            ". Check whether the undrawn CC/OD limit covers the deepest shortfall, or move the capex, drawings or supplier payments that cause it.";
        else if (nt > 0)
          note =
            nt +
            " month" +
            (nt > 1 ? "s fall" : " falls") +
            " below your buffer. Look at what is paid in " +
            (nt > 1 ? "those months" : "that month") +
            " before assuming the CC/OD line will absorb it.";
        else if (low < Infinity)
          note =
            "Every month stays above the buffer on these assumptions. Test a slower collection month to see how much headroom that leaves.";
        $("o_note").textContent = note;
        chart(close, buf);
      }
      function chart(v, buf) {
        const W = 720,
          H = 240,
          pl = 44,
          pr = 10,
          pt = 14,
          pb = 28,
          mx = Math.max(buf, ...v, 1),
          mn = Math.min(0, ...v);
        const y = (x) => pt + ((mx - x) / (mx - mn)) * (H - pt - pb),
          bw = (W - pl - pr) / 12;
        let s =
          '<svg viewBox="0 0 ' +
          W +
          " " +
          H +
          '" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="Roboto, sans-serif" font-size="11">';
        [mx, (mx + mn) / 2, mn].forEach((t) => {
          s +=
            '<text x="' +
            (pl - 6) +
            '" y="' +
            (y(t) + 4) +
            '" text-anchor="end" fill="#5a6566">' +
            Math.round(t) +
            "</text>";
        });
        v.forEach((c, i) => {
          const x = pl + i * bw + bw * 0.18,
            w = bw * 0.64,
            top = y(Math.max(c, 0)),
            bot = y(Math.min(c, 0));
          const col = c < 0 ? "#A3362A" : c < buf ? "#EEBA7D" : "#2B6DB2";
          s +=
            '<rect x="' +
            x.toFixed(1) +
            '" y="' +
            top.toFixed(1) +
            '" width="' +
            w.toFixed(1) +
            '" height="' +
            Math.max(bot - top, 1).toFixed(1) +
            '" fill="' +
            col +
            '" rx="2"><title>' +
            MONTHS[i] +
            ": " +
            Math.round(c) +
            "</title></rect>";
          s +=
            '<text x="' +
            (x + w / 2).toFixed(1) +
            '" y="' +
            (H - 8) +
            '" text-anchor="middle" fill="#5a6566" font-family="Roboto, sans-serif">' +
            MONTHS[i] +
            "</text>";
        });
        s +=
          '<line x1="' +
          pl +
          '" x2="' +
          (W - pr) +
          '" y1="' +
          y(0) +
          '" y2="' +
          y(0) +
          '" stroke="#082951" stroke-width="1"/>';
        s +=
          '<line x1="' +
          pl +
          '" x2="' +
          (W - pr) +
          '" y1="' +
          y(buf) +
          '" y2="' +
          y(buf) +
          '" stroke="#EEBA7D" stroke-width="1.5" stroke-dasharray="5 4"/>';
        $("chart").innerHTML = s + "</svg>";
      }
      build();
      $("cf").addEventListener("input", (e) => {
        const t = e.target;
        if (!t.dataset.k) return;
        const v = parseFloat(t.value);
        D[t.dataset.k][+t.dataset.m] = Number.isFinite(v) ? v : 0;
        calc();
      });
      ["open", "buf"].forEach((i) => $(i).addEventListener("input", calc));
      $("reset").addEventListener("click", () => {
        D = JSON.parse(JSON.stringify(EX));
        $("open").value = 120;
        $("buf").value = 75;
        build();
        calc();
      });
      $("clear").addEventListener("click", () => {
        Object.keys(D).forEach((k) => (D[k] = D[k].map(() => 0)));
        $("open").value = 0;
        build();
        calc();
      });
      calc();

      (function () {
        const a = document.querySelector(".tools-strip [aria-current]");
        if (a) {
          const c = a.parentElement;
          c.scrollLeft = a.offsetLeft - (c.clientWidth - a.offsetWidth) / 2;
        }
      })();
    
  },
  "overdraft-cost-calculator": function () {

      const $ = (id) => document.getElementById(id);
      const num = (id) => {
        const v = parseFloat($(id).value);
        return Number.isFinite(v) ? v : 0;
      };
      const fmt = (v, d = 2) =>
        Number.isFinite(v)
          ? v.toLocaleString("en-IN", {
              minimumFractionDigits: d,
              maximumFractionDigits: d,
            })
          : "—";

      function calc() {
        const lim = num("lim"),
          rate = num("rate") / 100,
          util = Math.min(num("util"), 100) / 100,
          pf = num("pf") / 100,
          unu = num("unu") / 100,
          oth = num("oth"),
          rev = num("rev"),
          days = num("days");
        const err = $("err"),
          ids = [
            "o_eff",
            "o_drawn",
            "o_int",
            "o_fee",
            "o_unu",
            "o_oth",
            "o_gst",
            "o_tot",
            "o_day",
            "o_freed",
            "o_save",
          ];
        if (lim <= 0 || util <= 0) {
          err.textContent =
            "Enter a sanctioned limit and an average utilisation greater than zero.";
          err.classList.add("on");
          ids.forEach((i) => ($(i).textContent = "—"));
          $("o_effsub").textContent = "";
          $("o_note").textContent = "";
          return;
        }
        err.classList.remove("on");
        const drawn = lim * util,
          ear = Math.pow(1 + rate / 12, 12) - 1,
          intr = drawn * ear;
        const fee = lim * pf,
          unc = (lim - drawn) * unu,
          gst = $("gst").checked ? 0.18 * (fee + unc + oth) : 0;
        const tot = intr + fee + unc + oth + gst,
          eff = tot / drawn;
        const freed = Math.min((days * rev) / 365, drawn),
          save = freed * ear;
        $("o_eff").textContent = fmt(eff * 100);
        $("o_effsub").textContent =
          "Against a headline rate of " + fmt(rate * 100) + "% p.a.";
        $("o_drawn").textContent = fmt(drawn);
        $("o_int").textContent = fmt(intr);
        $("o_fee").textContent = fmt(fee);
        $("o_unu").textContent = fmt(unc);
        $("o_oth").textContent = fmt(oth);
        $("o_gst").textContent = fmt(gst);
        $("o_tot").textContent = fmt(tot);
        $("o_day").textContent = "₹" + fmt((eff / 365) * 100000, 0);
        $("o_freed").textContent = fmt(freed);
        $("o_save").textContent = fmt(save);
        const notes = [];
        if (num("util") > 100)
          notes.push(
            "Utilisation above 100% means the account is overdrawn beyond its limit; it has been capped at 100% here. Check your sanction terms on overdrawings.",
          );
        if ((days * rev) / 365 > drawn)
          notes.push(
            "The cash freed is larger than the average balance drawn, so the saving is capped at clearing the line.",
          );
        if (util < 0.5)
          notes.push(
            "Utilisation is below half the limit. Fees on the unused portion are a large part of the cost; consider whether the limit is sized to need.",
          );
        $("o_note").textContent = notes.join(" ");
      }
      document
        .querySelectorAll("input")
        .forEach((i) => i.addEventListener("input", calc));
      calc();

      (function () {
        const a = document.querySelector(".tools-strip [aria-current]");
        if (a) {
          const c = a.parentElement;
          c.scrollLeft = a.offsetLeft - (c.clientWidth - a.offsetWidth) / 2;
        }
      })();
    
  },
  "gst-reconciliation-checklist": function () {

      const $ = (id) => document.getElementById(id);
      const num = (id) => {
        const v = parseFloat($(id).value);
        return Number.isFinite(v) ? v : 0;
      };
      const fmt = (v, d = 2) =>
        Number.isFinite(v)
          ? v.toLocaleString("en-IN", {
              minimumFractionDigits: d,
              maximumFractionDigits: d,
            })
          : "—";

      const STAGES = [
        {
          t: "Before the 14th: books ready",
          d: "Close the month in Tally or your ERP so there is something firm to match.",
          i: [
            [
              "Purchase register closed for the month",
              "All inward invoices, including late-arriving ones, booked with supplier GSTIN, invoice number, date and tax split.",
            ],
            [
              "Supplier GSTINs validated",
              "Check status on the GST portal. Credit on invoices from cancelled registrations is at risk.",
            ],
            [
              "Reverse charge purchases booked",
              "Tax on RCM supplies is paid in cash first; the credit follows.",
            ],
            [
              "Import bills of entry booked",
              "IGST paid on imports, matched to the bill of entry number.",
            ],
            [
              "Credit and debit notes from suppliers booked",
              "Supplier credit notes reduce your eligible ITC.",
            ],
            [
              "Blocked credits tagged",
              "Items covered by Section 17(5) tagged so they are never claimed.",
            ],
          ],
        },
        {
          t: "After the 14th: IMS and GSTR-2B",
          d: "Match what suppliers reported against what you booked.",
          i: [
            [
              "IMS reviewed: accept, reject or keep pending",
              "Records left without action are treated as accepted.",
            ],
            [
              "GSTR-2B matched to purchase register invoice by invoice",
              "Match on GSTIN, invoice number, date, taxable value and tax.",
            ],
            [
              "Mismatches classified",
              "Missing in GSTR-2B, missing in books, value difference, wrong GSTIN or place of supply.",
            ],
            [
              "GSTR-2B recomputed if IMS action was taken after the 14th",
              "So the GSTR-3B draws on the updated figures.",
            ],
            [
              "Import section of IMS and GSTR-2B checked",
              "Against bills of entry.",
            ],
            [
              "Supplier follow-up list sent",
              "Suppliers whose invoices are missing, with amounts, so they file or amend.",
            ],
          ],
        },
        {
          t: "Before filing GSTR-3B",
          d: "Claim only what is supported and reverse what must be reversed.",
          i: [
            [
              "ITC claimed limited to eligible credit in GSTR-2B",
              "Section 16(2)(aa) and Rule 36(4).",
            ],
            [
              "Permanent reversals entered",
              "Rules 42 and 43 and Section 17(5), in Table 4(B)(1).",
            ],
            [
              "Temporary reversals entered",
              "Including invoices unpaid for over 180 days, in Table 4(B)(2).",
            ],
            [
              "Credit reclaimed where conditions are now met",
              "Supplier has since reported, or payment has since been made.",
            ],
            [
              "Prior-year invoices checked against the Section 16(4) time limit",
              "Credit for a year cannot be taken after 30 November of the following year, or the annual return date if earlier.",
            ],
            [
              "Interest computed on any wrongly utilised credit",
              "Section 50(3).",
            ],
          ],
        },
        {
          t: "Periodic and year-end",
          d: "The checks that catch what slips through monthly.",
          i: [
            [
              "Rule 37A review",
              "Credit on invoices whose supplier has not filed GSTR-3B by 30 September of the following year is reversed by 30 November.",
            ],
            [
              "Annual reconciliation for GSTR-9",
              "Books, GSTR-3B and GSTR-2B agreed for the year.",
            ],
            [
              "Reversal and reclaim statement reconciled",
              "Opening balance agreed to your working.",
            ],
            [
              "Payments to micro and small suppliers checked",
              "Separate from GST: Section 15 of the MSMED Act and the income-tax deduction rule for amounts overdue at year-end.",
            ],
          ],
        },
      ];
      const KEY = "cfocraft-gst-checklist-v1";
      let done = {};
      try {
        done = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
      } catch (e) {
        done = {};
      }
      function render() {
        $("list").innerHTML = STAGES.map(
          (s, a) =>
            '<div class="stage"><h3>' +
            s.t +
            "</h3><p>" +
            s.d +
            "</p><ol>" +
            s.i
              .map((it, b) => {
                const id = "c" + a + "_" + b;
                return (
                  '<li><label for="' +
                  id +
                  '"><input type="checkbox" id="' +
                  id +
                  '"' +
                  (done[id] ? " checked" : "") +
                  "><span>" +
                  it[0] +
                  "<small>" +
                  it[1] +
                  "</small></span></label></li>"
                );
              })
              .join("") +
            "</ol></div>",
        ).join("");
      }
      function progress() {
        const all = [...document.querySelectorAll("#list input")],
          n = all.filter((c) => c.checked).length,
          p = Math.round((n / all.length) * 100);
        $("o_pct").textContent = p;
        $("o_cnt").textContent = n + " of " + all.length + " steps ticked";
        $("o_bar").style.width = p + "%";
      }
      function calc() {
        const books = num("books"),
          b2b = num("b2b"),
          cl = num("claimed"),
          d = num("days"),
          r180 = num("r180"),
          err = $("err");
        const gap = Math.max(books - b2b, 0);
        if (cl > gap) {
          err.textContent =
            "Unsupported ITC already claimed cannot exceed the gap between books and GSTR-2B. Check the figures.";
          err.classList.add("on");
        } else err.classList.remove("on");
        const c = Math.min(cl, gap),
          hold = gap - c,
          intr = (c * 0.18 * d) / 365;
        $("o_sup").textContent = "₹" + fmt(b2b, 0);
        $("o_gap").textContent = "₹" + fmt(gap, 0);
        $("o_hold").textContent = "₹" + fmt(hold, 0);
        $("o_rev1").textContent = "₹" + fmt(c, 0);
        $("o_rev2").textContent = "₹" + fmt(r180, 0);
        $("o_rev").textContent = "₹" + fmt(c + r180, 0);
        $("o_int").textContent = "₹" + fmt(intr, 0);
        $("o_note").textContent =
          b2b > books
            ? "GSTR-2B shows ₹" +
              fmt(b2b - books, 0) +
              " more than your books. Look for invoices not yet booked, credit notes not reported by suppliers, or records belonging to another GSTIN before claiming the excess."
            : "";
      }
      render();
      progress();
      $("list").addEventListener("change", (e) => {
        done[e.target.id] = e.target.checked;
        try {
          localStorage.setItem(KEY, JSON.stringify(done));
        } catch (x) {}
        progress();
      });
      $("resetck").addEventListener("click", () => {
        done = {};
        try {
          localStorage.removeItem(KEY);
        } catch (x) {}
        render();
        progress();
      });
      ["books", "b2b", "claimed", "days", "r180"].forEach((i) =>
        $(i).addEventListener("input", calc),
      );
      calc();

      (function () {
        const a = document.querySelector(".tools-strip [aria-current]");
        if (a) {
          const c = a.parentElement;
          c.scrollLeft = a.offsetLeft - (c.clientWidth - a.offsetWidth) / 2;
        }
      })();
    
  },
  "cma-data-template": function () {

      const $ = (id) => document.getElementById(id);
      const num = (id) => {
        const v = parseFloat($(id).value);
        return Number.isFinite(v) ? v : 0;
      };
      const fmt = (v, d = 2) =>
        Number.isFinite(v)
          ? v.toLocaleString("en-IN", {
              minimumFractionDigits: d,
              maximumFractionDigits: d,
            })
          : "—";

      function calc() {
        const g = (k) => num(k);
        const sales = g("sales"),
          cogs = g("cogs"),
          inv = g("inv"),
          rec = g("rec"),
          oca = g("oca"),
          cash = g("cash"),
          cred = g("cred"),
          ocl0 = g("ocl"),
          req = g("req"),
          tl = g("tl"),
          oltl = g("oltl"),
          tnw = g("tnw"),
          pat = g("pat"),
          dep = g("dep"),
          tli = g("tli"),
          tlp = g("tlp");
        const err = $("err");
        const tca = inv + rec + oca + cash,
          ocl = cred + ocl0,
          wcg = tca - ocl;
        const m1 = 0.75 * wcg,
          m2 = 0.75 * tca - ocl,
          tov = 0.2 * sales;
        const cr = ocl + req > 0 ? tca / (ocl + req) : NaN,
          nwc = tca - (ocl + req),
          need = 0.25 * tca;
        const tol = cred + ocl0 + req + tl + oltl,
          tolr = tnw > 0 ? tol / tnw : NaN,
          ds = tli + tlp > 0 ? (pat + dep + tli) / (tli + tlp) : NaN;
        if (tca <= 0) {
          err.textContent =
            "Enter current assets to compute the working capital gap and MPBF.";
          err.classList.add("on");
        } else err.classList.remove("on");
        $("o_m2").textContent = fmt(Math.max(m2, 0));
        $("o_m2sub").textContent =
          req > 0
            ? req <= m2
              ? "Requested limit of ₹" + fmt(req) + " lakh is within Method II."
              : "Requested limit exceeds Method II by ₹" +
                fmt(req - Math.max(m2, 0)) +
                " lakh."
            : "";
        $("o_tca").textContent = fmt(tca);
        $("o_ocl").textContent = fmt(ocl);
        $("o_wcg").textContent = fmt(wcg);
        $("o_m1").textContent = fmt(Math.max(m1, 0));
        $("o_tov").textContent = req > 500 ? "n/a above ₹5 cr" : fmt(tov);
        $("o_cr").textContent = fmt(cr);
        $("o_nwc").textContent = fmt(nwc) + " / " + fmt(need);
        $("o_tol").textContent = fmt(tolr);
        $("o_dscr").textContent = Number.isFinite(ds)
          ? fmt(ds)
          : "no term loan";
        $("o_hold").textContent =
          (cogs > 0 ? fmt((inv / cogs) * 12, 1) : "—") +
          " / " +
          (sales > 0 ? fmt((rec / sales) * 12, 1) : "—") +
          " / " +
          (cogs > 0 ? fmt((cred / cogs) * 12, 1) : "—") +
          " mo";
        const n = [];
        if (req > m2 && tca > 0)
          n.push(
            "To bring the request within Method II, net working capital would need to rise by about ₹" +
              fmt(req - Math.max(m2, 0)) +
              " lakh, or the request come down by that amount.",
          );
        if (Number.isFinite(cr) && cr < 1.33)
          n.push("Current ratio is below the 1.33 that Method II implies.");
        if (tnw <= 0)
          n.push(
            "Tangible net worth is zero or negative, so TOL/TNW cannot be computed; expect this to be the first question from the bank.",
          );
        if (m2 < 0 && tca > 0)
          n.push(
            "Other current liabilities exceed 75% of current assets, so Method II supports no bank finance.",
          );
        $("o_note").textContent = n.join(" ");
      }
      document
        .querySelectorAll("input")
        .forEach((i) => i.addEventListener("input", calc));
      calc();

      (function () {
        const a = document.querySelector(".tools-strip [aria-current]");
        if (a) {
          const c = a.parentElement;
          c.scrollLeft = a.offsetLeft - (c.clientWidth - a.offsetWidth) / 2;
        }
      })();
    
  }
  };
  const tool = document.body?.dataset?.page;
  if (!Object.prototype.hasOwnProperty.call(calculators, tool)) return;

  function init() {
    calculators[tool]();
    installNumericValidation(tool);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();

  function installNumericValidation(toolName) {
    const main = document.querySelector('main');
    if (!main) return;
    const invalids = () => [...main.querySelectorAll('input[type="number"]')];
    const labels = {
      rev: 'Revenue', cogs: 'Cost of goods sold', rate: 'Interest rate',
      lim:'Sanctioned limit', util:'Average utilisation',
      sales:'Net sales', books:'ITC as per books', b2b:'ITC as per GSTR-2B',
      open:'Opening cash', buf:'Minimum cash buffer'
    };
    function nameFor(el) { return el.getAttribute('aria-label') ||
        main.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent?.trim() ||
        labels[el.id] || 'This input'; }
    function problem(el) {
      const label = nameFor(el);
      const value = el.value.trim();
      if (!value) return `${label}: enter a number (use 0 if not applicable).`;
      const n = Number(value);
      if (!Number.isFinite(n)) return `${label}: enter a valid number.`;
      if (el.validity.badInput) return `${label}: enter a valid number.`;
      const min = el.hasAttribute('min') ? Number(el.min) : 0;
      if (n < min) return `${label}: enter ${min} or more.`;
      if (el.id === 'util' && n > 100) return 'Average utilisation must be between 0 and 100%.';
      if (el.hasAttribute('max') && n > Number(el.max)) return `${label}: enter ${el.max} or less.`;
      // These inputs act as denominators or essential borrowing quantities.
      const positive = toolName === 'working-capital-calculator' && ['rev','cogs'].includes(el.id) ||
        toolName === 'overdraft-cost-calculator' && ['lim','util'].includes(el.id);
      if (positive && n <= 0) return `${label}: enter a value greater than zero.`;
      return '';
    }
    function show(el, message) {
      const host = el.closest('.field') || el.closest('td') || el.parentElement;
      if (!host) return;
      let note = host.querySelector(':scope > .free-tool-field-error');
      if (!note && message) {
        note = document.createElement('small');
        note.className = 'free-tool-field-error';
        note.id = 'free-tool-err-' + (el.id || [el.dataset.k, el.dataset.m].join('-'));
        note.setAttribute('role','alert');
        host.append(note);
      }
      if (note) { note.textContent = message; note.hidden = !message; }
      el.setAttribute('aria-invalid', String(Boolean(message)));
      host.classList.toggle('free-tool-invalid', Boolean(message));
    }
    function check({display=false}={}) {
      let first=null, count=0;
      for (const el of invalids()) {
        const issue = problem(el);
        if (issue) {count++; if (!first) first = {el,message:issue};}
        if (display || el.dataset.toolTouched==='yes') show(el,issue);
      }
      if (display && first) {first.el.scrollIntoView({block:'center',behavior:'smooth'});first.el.focus({preventScroll:true});}
      return {valid:count===0, message:first?.message || ''};
    }
    main.addEventListener('focusout', e => {
      const el=e.target;
      if (el.matches?.('input[type="number"]')) {el.dataset.toolTouched='yes'; show(el,problem(el));}
    });
    main.addEventListener('input', e => {
      const el=e.target;
      if (el.matches?.('input[type="number"]') && el.dataset.toolTouched==='yes') show(el,problem(el));
    });
    // Reset buttons can regenerate the monthly table; query fresh controls each time.
    main.addEventListener('click', e => {
      if (e.target.closest?.('#reset,#clear')) {
        requestAnimationFrame(() => invalids().forEach(el => {
          el.dataset.toolTouched='';show(el,'');
        }));
      }
    });
    window.CFOFreeToolValidation = Object.freeze({check});
  }
})();

// Shared navigation interactions (unchanged).
document.addEventListener("DOMContentLoaded", () => {
        // ===== Navbar scroll effect =====
        const navbar = document.getElementById("navbar");
        if (navbar) {
          window.addEventListener("scroll", () => {
            if (window.scrollY > 50) {
              navbar.classList.add("scrolled");
            } else {
              navbar.classList.remove("scrolled");
            }
          });
        }

        // ===== Mobile menu toggle =====
        const mobileMenuBtn = document.getElementById("mobileMenuBtn");
        const navLinks = document.querySelector(".nav-links");
        if (mobileMenuBtn && navLinks) {
          mobileMenuBtn.addEventListener("click", () => {
            mobileMenuBtn.classList.toggle("active");
            navLinks.classList.toggle("active");
            // Close all open dropdowns when menu closes
            if (!navLinks.classList.contains("active")) {
              document
                .querySelectorAll(".nav-dropdown-wrap.open")
                .forEach((w) => w.classList.remove("open"));
            }
          });
        }

        // ===== Mobile dropdown accordion =====
        document
          .querySelectorAll(".nav-dropdown-wrap > .nav-link")
          .forEach((link) => {
            link.addEventListener("click", (e) => {
              // Only intercept on mobile (when hamburger is visible)
              if (window.innerWidth > 768) return;
              const wrap = link.closest(".nav-dropdown-wrap");
              const dropdown = wrap.querySelector(".nav-dropdown");
              if (!dropdown) return;
              e.preventDefault();
              // Close other open dropdowns (accordion behavior)
              document
                .querySelectorAll(".nav-dropdown-wrap.open")
                .forEach((w) => {
                  if (w !== wrap) w.classList.remove("open");
                });
              wrap.classList.toggle("open");
            });
          });

        // ===== Close mobile menu when navigating to a section =====
        if (navLinks && mobileMenuBtn) {
          navLinks
            .querySelectorAll("a:not(.nav-dropdown-wrap > .nav-link)")
            .forEach((itemLink) => {
              itemLink.addEventListener("click", () => {
                if (window.innerWidth <= 768) {
                  mobileMenuBtn.classList.remove("active");
                  navLinks.classList.remove("active");
                  document
                    .querySelectorAll(".nav-dropdown-wrap.open")
                    .forEach((w) => w.classList.remove("open"));
                }
              });
            });
        }

        // ===== FAQ Accordion =====
        const faqQuestions = document.querySelectorAll(".faq-question");
        faqQuestions.forEach((btn) => {
          btn.addEventListener("click", () => {
            const item = btn.parentElement;
            const isOpen = item.classList.contains("open");
            document
              .querySelectorAll(".faq-item")
              .forEach((i) => i.classList.remove("open"));
            if (!isOpen) item.classList.add("open");
          });
        });

        // ===== Counter Animation =====
        const counterObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll(".counter");
                counters.forEach((counter) => {
                  const target = parseFloat(counter.dataset.target);
                  const duration = 2000;
                  const step = target / (duration / 16);
                  let current = 0;
                  const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                      current = target;
                      clearInterval(timer);
                    }
                    if (target % 1 !== 0) {
                      counter.textContent = current.toFixed(1);
                    } else {
                      counter.textContent =
                        Math.floor(current).toLocaleString();
                    }
                  }, 16);
                });
                counterObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.3 },
        );

        const metricsGrid = document.querySelector(".metrics-grid");
        if (metricsGrid) counterObserver.observe(metricsGrid);

        // ===== Scroll Reveal Animation =====
        const revealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                revealObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.1 },
        );

        document
          .querySelectorAll(
            ".feature-row, .team-card, .metric-card, .testimonial-card, .section-heading, .hero-content",
          )
          .forEach((el) => {
            el.classList.add("reveal");
            revealObserver.observe(el);
          });

        // ===== Case Studies Modal & Slider =====
        const csModal = document.getElementById("case-studies-modal");
        const openCsModalBtn = document.getElementById("open-cs-modal");
        const closeCsModalBtn = document.querySelector(".cs-modal-close");
        const csSlider = document.getElementById("cs-slider");
        const csPrevBtn = document.getElementById("cs-prev");
        const csNextBtn = document.getElementById("cs-next");

        let currentSlide = 0;
        const totalSlides = 9;

        function updateSliderPosition() {
          if (csSlider) {
            csSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
          }
        }

        if (openCsModalBtn && csModal) {
          openCsModalBtn.addEventListener("click", (e) => {
            e.preventDefault();
            csModal.classList.add("show");
            updateSliderPosition();
          });
        }

        if (closeCsModalBtn && csModal) {
          closeCsModalBtn.addEventListener("click", () => {
            csModal.classList.remove("show");
          });
        }

        if (csModal) {
          window.addEventListener("click", (e) => {
            if (e.target === csModal) {
              csModal.classList.remove("show");
            }
          });
        }

        if (csNextBtn) {
          csNextBtn.addEventListener("click", () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSliderPosition();
          });
        }

        if (csPrevBtn) {
          csPrevBtn.addEventListener("click", () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateSliderPosition();
          });
        }
      });

// Shared OTP / verified PDF flow with frontend field validation.
/* CFO CRAFT Free Report: email OTP -> verified PDF. Production PDF is issued ONLY by backend. */
(() => {
  'use strict';
  const TOOL_NAMES = {
    'working-capital-calculator':'Working Capital Calculator',
    'monthly-cash-flow-model':'Monthly Cash Flow Model',
    'overdraft-cost-calculator':'Overdraft Cost Calculator',
    'gst-reconciliation-checklist':'GST Reconciliation Checklist',
    'cma-data-template':'CMA Data Template'
  };
  const FIELDS = {
    'working-capital-calculator': {rev:'Revenue from operations (Rs lakh)',cogs:'Cost of goods sold (Rs lakh)',inv:'Average inventory (Rs lakh)',rec:'Average trade receivables (Rs lakh)',pay:'Average trade payables (Rs lakh)',rate:'CC / OD rate (% p.a.)',cut_dso:'Collect faster by (days)',cut_dio:'Hold less stock by (days)',ext_dpo:'Pay suppliers later by (days)'},
    'overdraft-cost-calculator': {lim:'Sanctioned CC / OD limit (Rs lakh)',rate:'Interest rate (% p.a.)',util:'Average utilisation (%)',pf:'Processing / renewal fee (%)',unu:'Unutilised limit charge (%)',oth:'Other annual charges (Rs lakh)',gst:'Add GST on fees',rev:'Annual revenue (Rs lakh)',days:'Collect faster by (days)'},
    'cma-data-template': {sales:'Net sales (Rs lakh)',cogs:'Cost of sales (Rs lakh)',pat:'Profit after tax (Rs lakh)',dep:'Depreciation (Rs lakh)',tli:'Term loan interest (Rs lakh)',tlp:'Term loan principal due (Rs lakh)',inv:'Inventory (Rs lakh)',rec:'Receivables (Rs lakh)',oca:'Other current assets (Rs lakh)',cash:'Cash and bank balances (Rs lakh)',cred:'Sundry creditors (Rs lakh)',ocl:'Other current liabilities (Rs lakh)',req:'Working capital limit requested (Rs lakh)',tl:'Term loans outstanding (Rs lakh)',oltl:'Other long term liabilities (Rs lakh)',tnw:'Tangible net worth (Rs lakh)'},
    'gst-reconciliation-checklist': {books:'ITC as per purchase register (Rs)',b2b:'ITC as per GSTR-2B (Rs)',claimed:'Unsupported ITC already claimed (Rs)',days:'Days since utilisation',r180:'Invoices unpaid over 180 days: ITC (Rs)'},
    'monthly-cash-flow-model': {open:'Opening cash (Rs lakh)',buf:'Minimum cash buffer (Rs lakh)'}
  };
  const RESULTS = {
    'working-capital-calculator': [['o_ccc','Cash conversion cycle (days)'],['o_dio','Inventory days / DIO'],['o_dso','Receivable days / DSO'],['o_dpo','Payable days / DPO'],['o_ccc2','Cash conversion cycle - detailed'],['o_nwc','Net working capital locked (Rs lakh)'],['o_carry','Annual carrying cost (Rs lakh)'],['o_rel','Cash released by changes (Rs lakh)'],['o_save','Annual interest saved (Rs lakh)'],['o_new','Cycle after changes (days)']],
    'overdraft-cost-calculator': [['o_eff','Effective annual cost (%)'],['o_drawn','Average amount drawn (Rs lakh)'],['o_int','Compounded annual interest (Rs lakh)'],['o_fee','Renewal / processing fee (Rs lakh)'],['o_unu','Charge on unutilised limit (Rs lakh)'],['o_oth','Other charges (Rs lakh)'],['o_gst','GST on fees and charges (Rs lakh)'],['o_tot','Total annual cost (Rs lakh)'],['o_day','Cost of Rs 1 lakh for one day (Rs)'],['o_freed','Cash freed by faster collections (Rs lakh)'],['o_save','Annual interest saved (Rs lakh)']],
    'cma-data-template': [['o_m2','MPBF Method II (Rs lakh)'],['o_tca','Total current assets (Rs lakh)'],['o_ocl','Current liabilities excluding bank borrowing (Rs lakh)'],['o_wcg','Working capital gap (Rs lakh)'],['o_m1','MPBF Method I (Rs lakh)'],['o_tov','MPBF turnover method (Rs lakh)'],['o_cr','Current ratio at requested limit'],['o_nwc','Net working capital - actual / needed (Rs lakh)'],['o_tol','TOL / TNW'],['o_dscr','Debt service coverage ratio'],['o_hold','Stock / debtor / creditor holding days']],
    'gst-reconciliation-checklist': [['o_pct','Checklist completion (%)'],['o_cnt','Checklist steps ticked'],['o_sup','ITC supported by GSTR-2B (Rs)'],['o_gap','Gap: books over GSTR-2B (Rs)'],['o_hold','Hold until supplier reports (Rs)'],['o_rev1','Reverse unsupported ITC (Rs)'],['o_rev2','Reverse unpaid over 180 days (Rs)'],['o_rev','Total ITC to reverse (Rs)'],['o_int','Indicative interest exposure (Rs)']],
    'monthly-cash-flow-model': [['o_low','Lowest month-end cash (Rs lakh)'],['o_lowm','Lowest month'],['o_rin','Annual receipts (Rs lakh)'],['o_pout','Annual payments (Rs lakh)'],['o_net','Annual net cash flow (Rs lakh)'],['o_close','Closing cash on 31 March (Rs lakh)'],['o_tight','Months below buffer'],['o_short','Months in shortfall']]
  };
  const tool = document.body.dataset.page;
  if (!TOOL_NAMES[tool]) return;
  const api = String(window.CFO_FREE_REPORT_API || 'https://api.cfocraft.com/api/free-report').replace(/\/+$/,'');
  const txt = el => (el?.textContent || '').replace(/\s+/g,' ').trim();
  const safe = s => String(s ?? '').slice(0,200);
  function snapshot(){
    const checked = window.CFOFreeToolValidation?.check({display:true});
    if (checked && !checked.valid) throw new Error(checked.message);
    if (document.querySelector('main #err.on')) throw new Error('Please correct the highlighted calculator inputs first.');
    const inputs = Object.entries(FIELDS[tool]).map(([id,label]) => {
      const el=document.getElementById(id);
      return {label,value:el?.type==='checkbox' ? (el.checked?'Yes':'No') : safe(el?.value || '0')};
    });
    const results = RESULTS[tool].map(([id,label])=>({label,value:safe(txt(document.getElementById(id)))}));
    if(results.some(r=>!r.value || r.value==='—' || r.value==='-')) throw new Error('Please enter valid calculator inputs so the report has complete results.');
    const tables=[];
    const cash = document.getElementById('cf');
    if(tool==='monthly-cash-flow-model' && cash){
      const rows=[...cash.querySelectorAll('tr')].map(tr=>[...tr.children].map(cell=>{
        const input=cell.querySelector('input');return safe(input?input.value:txt(cell));
      }));
      tables.push({title:'12-month cash flow model (Rs lakh)',rows});
    }
    const checklist=[];
    if(tool==='gst-reconciliation-checklist'){
      document.querySelectorAll('#list .stage').forEach(stage=>{
        const group=txt(stage.querySelector('h3'));
        stage.querySelectorAll('li label').forEach(label=>{
          checklist.push({group,task:safe(txt(label.querySelector('span')?.childNodes[0])),done:!!label.querySelector('input')?.checked});
        });
      });
    }
    const notes=txt(document.getElementById('o_note')).slice(0,1800);
    const methodology=[...document.querySelectorAll('main .read')].slice(0,2).map(sec=>({title:txt(sec.querySelector('h2'))||'How it is worked out',text:txt(sec).slice(0,4800)}));
    return {tool,title:TOOL_NAMES[tool],generatedAt:new Date().toISOString(),inputs,results,tables,checklist,notes,methodology};
  }
  const interest = {
    'working-capital-calculator':['Reduce cash tied up','Improve collections','Inventory optimisation','Working capital funding'],
    'monthly-cash-flow-model':['Cash flow forecasting','Prevent cash shortfalls','Budgeting and reporting'],
    'overdraft-cost-calculator':['Reduce borrowing cost','Review bank charges','Manage OD utilisation'],
    'gst-reconciliation-checklist':['GST reconciliation','Input tax credit reviews','Finance controls'],
    'cma-data-template':['CMA preparation','Bank loan proposals','MPBF assessment']
  };
  function launch(){
    const card=document.createElement('section'); card.className='report-panel';card.setAttribute('aria-label','Free PDF report');
    card.innerHTML=`<div class="report-panel-copy"><p class="report-eyebrow">FREE REPORT</p><h3>Download your analysis</h3><p>Your current inputs, calculations and results, prepared as a personalised PDF report.</p></div><button type="button" class="report-open">↓ download</button>`;
    const slip=document.querySelector('#tool-start .slip')||document.querySelector('.cfsum .slip');
    if(slip){const stack=document.createElement('div');stack.className='report-result-stack';slip.before(stack);stack.append(slip,card);} else document.querySelector('main')?.append(card);
    document.querySelectorAll('a[href="REPLACE_WITH_TEMPLATE_URL"],a[href="REPLACE_WITH_CMA_TEMPLATE_URL"]').forEach(a=>(a.closest('.slip-note')||a).remove());
    const backdrop=document.createElement('div');backdrop.className='report-backdrop';backdrop.hidden=true;
    backdrop.innerHTML=`<div class="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title" tabindex="-1">
      <button type="button" class="report-close" aria-label="Close">×</button>
      <div class="report-head"><p class="report-eyebrow">CFO CRAFT · FREE REPORT</p><h2 id="report-modal-title">Get your personalised report</h2><p>Enter your email to continue. New visitors register once; verified visitors can download again from a trusted browser.</p></div>
      <form id="report-email-form" novalidate>
        <label class="report-otp-label">Email address <input type="email" name="email" autocomplete="email" maxlength="180" required placeholder="name@company.com"></label>
        <p class="report-error" role="alert" aria-live="polite" hidden></p>
        <button class="report-primary" type="submit">Continue →</button>
      </form>
      <form id="report-form" hidden novalidate>
      <div class="report-fields">
        <label><span class="report-field-title">Full name <b>*</b></span><input name="name" required maxlength="100" autocomplete="name" placeholder="Your full name"></label>
        <label><span class="report-field-title">Company / business <b>*</b></span><input name="company" required maxlength="120" autocomplete="organization" placeholder="Company name"></label>
        <label><span class="report-field-title">Work email <b>*</b></span><input name="email" required type="email" maxlength="180" autocomplete="email" placeholder="name@company.com"></label>
        <label><span class="report-field-title">Mobile <b>*</b></span><input name="phone" required type="tel" maxlength="22" autocomplete="tel" placeholder="+91 98765 43210"></label>
        <label>City <input name="city" maxlength="90" autocomplete="address-level2" placeholder="Optional"></label>
        <label>Business type <select name="industry"><option value="">Select (optional)</option><option>Manufacturing</option><option>Trading & distribution</option><option>Services</option><option>Startup</option><option>Other</option></select></label>
        <label class="report-wide">What support would help? <select name="interest"><option value="">Select (optional)</option>${interest[tool].map(x=>`<option>${x}</option>`).join('')}<option>Just exploring</option><option>Other</option></select></label>
      </div>
      <label class="report-check"><input name="privacyConsent" type="checkbox" required> <span>I agree to use my email for OTP verification and to process my details to issue this PDF. <strong>*</strong></span></label>
      <label class="report-check"><input name="followupConsent" type="checkbox"> <span>CFO CRAFT may contact me about advisory services. (Optional)</span></label>
      <p class="report-privacy">We verify your email once for your trusted browser session and record each PDF download request for security and audit purposes. Financial inputs are used to prepare the PDF and are not saved as lead data. Advisory follow-up is optional.</p>
      <p class="report-error" role="alert" aria-live="polite" hidden></p>
      <button class="report-primary" type="submit">Send email verification code →</button>
      </form>
      <form id="report-otp-form" hidden novalidate>
      <div class="report-otp-info">A 6-digit verification code has been sent to <strong class="report-email-display"></strong>. It expires in 5 minutes.</div>
      <label class="report-otp-label">Email verification code <input id="report-otp" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required></label>
      <p class="report-error report-otp-error" role="alert" aria-live="polite" hidden></p>
      <button class="report-primary" type="submit">Verify &amp; download →</button>
      <div class="report-otp-actions"><button type="button" class="report-resend">Resend code</button><button type="button" class="report-edit">Edit email / details</button></div>
      </form></div>`;
    document.body.append(backdrop);
    const contactForm=backdrop.querySelector('#report-form'), otpForm=backdrop.querySelector('#report-otp-form'), emailForm=backdrop.querySelector('#report-email-form');
    const emailErr=emailForm.querySelector('.report-error');
    const generalErr=backdrop.querySelector('#report-form .report-error'),otpErr=backdrop.querySelector('.report-otp-error');
    const openButton=card.querySelector('.report-open');
    let lead=null, challengeId=null, downloadToken=null, pending=false, returning=false, currentEmail='';
    function error(node,message){node.textContent=message;node.hidden=!message;}
    function toggleBusy(el,busy,label){el.disabled=busy;el.textContent=label;}
    function close(){if(pending)return;backdrop.hidden=true;document.body.classList.remove('report-modal-open');openButton.focus();}
    function open(){
      try { snapshot(); } catch (err) {
        const problem = document.querySelector('main #err.on');
        if(problem) problem.scrollIntoView({block:'center',behavior:'smooth'});
        return;
      }
      backdrop.hidden=false;document.body.classList.add('report-modal-open');emailForm.hidden=false;contactForm.hidden=true;otpForm.hidden=true;error(emailErr,'');error(generalErr,'');error(otpErr,'');emailForm.elements.namedItem('email').focus();
    }
    openButton.addEventListener('click',open);
    backdrop.querySelector('.report-close').addEventListener('click',close);
    backdrop.addEventListener('click',e=>{if(e.target===backdrop)close();});
    document.addEventListener('keydown',e=>{if(backdrop.hidden)return;if(e.key==='Escape')close(); if(e.key==='Tab'){const focusable=[...backdrop.querySelectorAll('button,input,select')].filter(el=>!el.disabled && el.offsetParent!==null);if(focusable.length){const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}});
    async function jsonRequest(path,payload){
      const r=await fetch(api+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),mode:'cors',cache:'no-store',credentials:'include'});
      let obj={};try{obj=await r.json();}catch(_){}
      if(!r.ok)throw new Error(obj.error || (r.status===429?'Too many attempts; please try later.':'Verification service unavailable. Please try again.'));
      return obj;
    }
    async function sendCode(){
      const reply=await jsonRequest(returning?'/returning/start':'/start',returning?{email:currentEmail,tool,page:location.pathname}:{...lead,tool,page:location.pathname});
      challengeId=reply.challengeId;downloadToken=null;
      if(!challengeId)throw new Error('The server did not issue a verification request.');
      contactForm.hidden=true;otpForm.hidden=false;
      backdrop.querySelector('.report-email-display').textContent=currentEmail;
      backdrop.querySelector('#report-otp').value='';backdrop.querySelector('#report-otp').focus();
    }
    async function fetchPDF(sessionMode=false){
      const data=snapshot();
      const response=await fetch(api+(sessionMode?'/session/download':'/download'),{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(sessionMode?{report:data}:{downloadToken,report:data}),
        mode:'cors',cache:'no-store',credentials:'include'
      });
      if(!response.ok){let payload={};try{payload=await response.json();}catch(_){}
        throw new Error(payload.error || 'Could not generate your PDF. Please retry.');}
      const blob=await response.blob();
      if(!blob.type.includes('pdf'))throw new Error('The server did not return a PDF.');
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=`CFOCRAFT_${tool}_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),45000);
    }
    emailForm.addEventListener('submit',async e=>{
      e.preventDefault();if(pending)return;
      error(emailErr,'');currentEmail=String(emailForm.elements.namedItem('email').value||'').trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(currentEmail)){
        error(emailErr,'Enter a valid email address.');return;
      }
      const btn=emailForm.querySelector('[type=submit]');pending=true;toggleBusy(btn,true,'Checking…');
      try{
        const result=await jsonRequest('/check-email',{email:currentEmail});
        returning=Boolean(result.registered);
        if(!returning){
          contactForm.elements.namedItem('email').value=currentEmail;
          emailForm.hidden=true;contactForm.hidden=false;contactForm.elements.namedItem('name').focus();
        }else if(result.trusted){
          await fetchPDF(true);pending=false;close();
        }else{
          await sendCode();emailForm.hidden=true;
        }
      }catch(err){error(emailErr,err.message||'Unable to continue.');}
      finally{pending=false;toggleBusy(btn,false,'Continue →');}
    });
    const contactNames = ['name','company','email','phone','city','industry','interest','privacyConsent'];
    const getField = name => contactForm.elements.namedItem(name);
    function normalisePhone(raw) {
      const cleaned=String(raw||'').trim().replace(/[\s().-]/g,'');
      if (/^[6-9]\d{9}$/.test(cleaned)) return '+91'+cleaned;
      if (/^\+91[6-9]\d{9}$/.test(cleaned)) return cleaned;
      if (/^\+91/.test(cleaned)) return null;
      return /^\+[1-9]\d{7,14}$/.test(cleaned) ? cleaned : null;
    }
    function fieldProblem(name) {
      const el=getField(name), value=String(el?.value||'').trim();
      if(name==='privacyConsent') return el.checked?'':'Please agree to verification and report processing.';
      if(name==='name') {
        if(!value) return 'Full name is required.';
        if(value.length<2 || value.length>100 || !/^[\p{L}\p{M}][\p{L}\p{M} .’'\-]*$/u.test(value) || (value.match(/\p{L}/gu)||[]).length<2) return 'Enter a valid name (2–100 letters, spaces, apostrophes or hyphens).';
      }
      if(name==='company') {
        if(!value) return 'Company / business name is required.';
        if(value.length<2 || value.length>120 || !/[\p{L}\p{N}]/u.test(value)) return 'Enter a valid company or business name (2–120 characters).';
      }
      if(name==='email') {
        if(!value) return 'Work email is required.';
        if(value.length>180 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value)) return 'Enter a valid email, for example name@company.com.';
      }
      if(name==='phone') {
        if(!value) return 'Mobile number is required.';
        if(!normalisePhone(value)) return 'Enter a valid Indian 10-digit mobile or international number with +country code.';
      }
      if(name==='city' && value && (value.length>90 || value.length<2)) return 'City should contain 2–90 characters.';
      return '';
    }
    function paintContact(name,message) {
      const el=getField(name);if(!el)return;
      const label=el.closest('label');if(!label)return;
      let note=label.querySelector('.report-field-error');
      if(!note){note=document.createElement('small');note.className='report-field-error';note.hidden=true;note.id='report-error-'+name;label.append(note);}
      note.textContent=message;note.hidden=!message;
      el.setAttribute('aria-invalid',String(Boolean(message)));
      label.classList.toggle('report-invalid',Boolean(message));
    }
    function validateContact(showAll=false) {
      let first=null;
      for(const name of contactNames){
        const field=getField(name), message=fieldProblem(name);
        if(message && !first) first={field,message};
        if(showAll || field?.dataset?.touched==='yes') paintContact(name,message);
      }
      return first;
    }
    contactForm.addEventListener('focusout',e=>{
      if(e.target.name && contactNames.includes(e.target.name)) {
        e.target.dataset.touched='yes';paintContact(e.target.name,fieldProblem(e.target.name));
      }
    });
    contactForm.addEventListener('input',e=>{
      if(e.target.name && contactNames.includes(e.target.name) && e.target.dataset.touched==='yes') paintContact(e.target.name,fieldProblem(e.target.name));
    });
    contactForm.addEventListener('change',e=>{
      if(e.target.name && contactNames.includes(e.target.name)) {
        e.target.dataset.touched='yes';paintContact(e.target.name,fieldProblem(e.target.name));
      }
    });
    contactForm.addEventListener('submit',async e=>{
      e.preventDefault();error(generalErr,'');
      const bad=validateContact(true);
      if(bad){error(generalErr,'Please correct the highlighted fields before continuing.');bad.field.focus();return;}
      try{snapshot();}catch(err){error(generalErr,err.message);return;}
      const fd=new FormData(contactForm);
      lead={name:String(fd.get('name')).trim().replace(/\s+/g,' '),company:String(fd.get('company')).trim(),email:String(fd.get('email')).trim().toLowerCase(),phone:normalisePhone(fd.get('phone')),city:String(fd.get('city')||'').trim(),industry:String(fd.get('industry')||''),interest:String(fd.get('interest')||''),privacyConsent:fd.get('privacyConsent')==='on',followupConsent:fd.get('followupConsent')==='on'};
      currentEmail=lead.email;returning=false;
      const btn=contactForm.querySelector('[type=submit]');pending=true;toggleBusy(btn,true,'Sending code…');
      try{await sendCode();}catch(err){error(generalErr,err.message || 'Unable to send code.');}
      finally{pending=false;toggleBusy(btn,false,'Send email verification code →');}
    });
    const codeInput=backdrop.querySelector('#report-otp');
    codeInput.addEventListener('input',()=>{codeInput.value=codeInput.value.replace(/\D/g,'').slice(0,6);if(/^\d{6}$/.test(codeInput.value))error(otpErr,'');});
    backdrop.querySelector('.report-edit').addEventListener('click',()=>{otpForm.hidden=true;emailForm.hidden=false;contactForm.hidden=true;challengeId=null;downloadToken=null;error(otpErr,'');});
    backdrop.querySelector('.report-resend').addEventListener('click',async e=>{if(!currentEmail||pending)return;pending=true;toggleBusy(e.currentTarget,true,'Sending…');error(otpErr,'');try{await sendCode();}catch(err){error(otpErr,err.message);}finally{pending=false;toggleBusy(e.currentTarget,false,'Resend code');}});
    otpForm.addEventListener('submit',async e=>{
      e.preventDefault();error(otpErr,'');const code=backdrop.querySelector('#report-otp').value.trim();
      if(!/^\d{6}$/.test(code)){error(otpErr,'Enter the 6-digit code from your email.');return;}
      const btn=otpForm.querySelector('[type=submit]');pending=true;toggleBusy(btn,true,'Verifying & preparing PDF…');
      try{
        if(!downloadToken){const verified=await jsonRequest('/verify',{challengeId,code});downloadToken=verified.downloadToken; if(!downloadToken)throw new Error('Verification succeeded but report token was missing.');}
        await fetchPDF(false);
        downloadToken=null;challengeId=null;lead=null;contactForm.reset();otpForm.reset();contactNames.forEach(name=>{const field=getField(name);if(field)field.dataset.touched='';paintContact(name,'');});otpForm.hidden=true;contactForm.hidden=true;emailForm.hidden=false;
        pending=false;close();
      }catch(err){error(otpErr,err.message||'Unable to download.');}finally{pending=false;toggleBusy(btn,false,'Verify & download →');}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',launch);else launch();
})();
