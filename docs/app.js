      const KEY = "tapein-v1";
      const TZ = "America/Chicago";

      function load() {
        try {
          return JSON.parse(localStorage.getItem(KEY)) || { users: [], visits: [], sessionId: null };
        } catch {
          return { users: [], visits: [], sessionId: null };
        }
      }
      function save(state) {
        localStorage.setItem(KEY, JSON.stringify(state));
      }

      function chicagoDate(d = new Date()) {
        return new Intl.DateTimeFormat("en-CA", {
          timeZone: TZ,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(d);
      }
      function weekStartMonday(d = new Date()) {
        const ymd = chicagoDate(d);
        const [y, m, day] = ymd.split("-").map(Number);
        const utc = new Date(Date.UTC(y, m - 1, day, 12));
        const dow = utc.getUTCDay();
        utc.setUTCDate(utc.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
        return utc.toISOString().slice(0, 10);
      }
      function weekEndSunday(start) {
        const [y, m, d] = start.split("-").map(Number);
        const utc = new Date(Date.UTC(y, m - 1, d, 12));
        utc.setUTCDate(utc.getUTCDate() + 6);
        return utc.toISOString().slice(0, 10);
      }
      function formatWeekRange(start) {
        const end = weekEndSunday(start);
        const fmt = (iso) => {
          const [y, mo, da] = iso.split("-").map(Number);
          return new Date(Date.UTC(y, mo - 1, da, 12)).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          });
        };
        return fmt(start) + " – " + fmt(end);
      }
      function formatClock(iso) {
        return new Date(iso).toLocaleString("en-US", {
          timeZone: TZ,
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }
      function uid() {
        return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      }

      let state = load();
      let screen = state.sessionId ? "app" : "auth";
      let authMode = "signup";
      let tab = "confirm";
      let toastMsg = "";
      let toastTimer = 0;

      function toast(msg) {
        toastMsg = msg;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          toastMsg = "";
          render();
        }, 2200);
        render();
      }
      function persist() {
        save(state);
      }
      function currentUser() {
        return state.users.find((u) => u.id === state.sessionId) || null;
      }
      function thisWeekVisits() {
        const start = weekStartMonday();
        return state.visits.filter((v) => v.weekStart === start);
      }

      function signUp(name, password) {
        const n = name.trim();
        if (n.length < 2) return "Enter your name.";
        if (password.length < 4) return "Password must be at least 4 characters.";
        if (state.users.some((u) => u.name.toLowerCase() === n.toLowerCase())) {
          return "That name is already taken.";
        }
        const user = { id: uid(), name: n, password };
        state.users.push(user);
        state.sessionId = user.id;
        persist();
        screen = "app";
        tab = "confirm";
        toast("Account created.");
        return null;
      }
      function signIn(name, password) {
        const n = name.trim();
        const user = state.users.find((u) => u.name.toLowerCase() === n.toLowerCase());
        if (!user || user.password !== password) return "Name or password is wrong.";
        state.sessionId = user.id;
        persist();
        screen = "app";
        tab = "confirm";
        render();
        return null;
      }
      function signOut() {
        state.sessionId = null;
        persist();
        screen = "landing";
        render();
      }
      function checkIn() {
        const me = currentUser();
        if (!me) return;
        state.visits.unshift({
          id: uid(),
          userId: me.id,
          name: me.name,
          createdAt: new Date().toISOString(),
          weekStart: weekStartMonday(),
          yes: [],
          no: [],
          status: "pending",
        });
        persist();
        toast("Checked in. Needs 2 yeses.");
      }
      function vote(visitId, choice) {
        const me = currentUser();
        const visit = state.visits.find((v) => v.id === visitId);
        if (!me || !visit) return;
        if (visit.userId === me.id) return;
        if (visit.yes.includes(me.id) || visit.no.includes(me.id)) return;
        visit[choice].push(me.id);
        if (visit.yes.length >= 2) visit.status = "approved";
        persist();
        if (visit.status === "approved") toast("Confirmed. On the board.");
        else if (choice === "yes") toast(visit.yes.length + " of 2");
        else toast("Noted.");
      }

      function el(html) {
        const t = document.createElement("template");
        t.innerHTML = html.trim();
        return t.content;
      }

      function renderLanding() {
        return `
          <header class="header">
            <div class="header-inner"><a class="brand" href="#">ATR TRACKER</a></div>
          </header>
          <main class="hero">
            <h1>ATR Tracker</h1>
            <p class="lede">Check in when you go in. Two teammates confirm it. The board counts the week.</p>
            <div class="stack">
              <button class="btn btn-primary" data-go="signup">Create an account</button>
              <button class="btn btn-outline" data-go="signin">Sign in</button>
            </div>
          </main>`;
      }

      function renderAuth() {
        const title = authMode === "signup" ? "Create account" : "Sign in";
        const cta = authMode === "signup" ? "Create account" : "Sign in";
        const swap = authMode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one";
        return `
          <header class="header">
            <div class="header-inner"><a class="brand" href="#" data-home>ATR TRACKER</a></div>
          </header>
          <main>
            <h1 style="font-size:1.875rem;margin-top:1.25rem">${title}</h1>
            <p class="lede">Two confirms and it counts this week.</p>
            <form id="auth-form" class="stack" style="margin-top:2rem">
              <div>
                <label for="name">Name</label>
                <input id="name" name="name" autocomplete="name" required minlength="2" />
              </div>
              <div>
                <label for="password">Password</label>
                <input id="password" name="password" type="password" required minlength="4" />
              </div>
              <button class="btn btn-primary" type="submit">${cta}</button>
            </form>
            <p style="margin-top:1.5rem;text-align:center">
              <button class="linkish" type="button" data-swap>${swap}</button>
            </p>
            <p style="margin-top:1.5rem;text-align:center">
              <button class="linkish" type="button" data-home>Back</button>
            </p>
          </main>`;
      }

      function renderApp() {
        const me = currentUser();
        const week = weekStartMonday();
        const visits = thisWeekVisits();
        const toConfirm = visits.filter((v) => v.userId !== me.id && v.status === "pending");
        const myPending = visits.filter((v) => v.userId === me.id && v.status === "pending").length;
        const board = state.users
          .map((u) => {
            const mine = visits.filter((v) => v.userId === u.id);
            return {
              id: u.id,
              name: u.name,
              approved: mine.filter((v) => v.status === "approved").length,
            };
          })
          .sort((a, b) => b.approved - a.approved || a.name.localeCompare(b.name));

        const confirmList = toConfirm.length
          ? toConfirm
              .map((v) => {
                const voted = v.yes.includes(me.id) ? "Yes" : v.no.includes(me.id) ? "No" : null;
                const actions = voted
                  ? `<p class="meta">${voted}</p>`
                  : `<div class="row-btns">
                       <button class="btn btn-primary btn-sm" data-vote="${v.id}" data-choice="yes">Yes</button>
                       <button class="btn btn-outline btn-sm" data-vote="${v.id}" data-choice="no">No</button>
                     </div>`;
                const extra = v.yes.length ? ` · ${v.yes.length}/2` : "";
                return `<li class="item">
                  <div class="grow">
                    <p class="name">${escapeHtml(v.name)}</p>
                    <p class="meta">${formatClock(v.createdAt)}${extra}</p>
                  </div>
                  ${actions}
                </li>`;
              })
              .join("")
          : `<p class="empty" style="margin-top:0.75rem">Nobody waiting on a confirm.</p>`;

        const boardList = board.length
          ? board
              .map((row, i) => {
                const you = row.id === me.id ? ` <span class="meta" style="display:inline">you</span>` : "";
                return `<li class="item${row.id === me.id ? " you" : ""}">
                  <span class="rank">${i + 1}</span>
                  <p class="name grow">${escapeHtml(row.name)}${you}</p>
                  <span class="count">${row.approved}</span>
                </li>`;
              })
              .join("")
          : `<p class="empty">No one on the board yet.</p>`;

        const body =
          tab === "confirm"
            ? `<div style="padding-top:1.25rem">
                <button class="btn btn-primary" style="width:100%" data-checkin>I went in</button>
                ${myPending ? `<p class="hint">${myPending} of yours waiting on 2 confirms</p>` : ""}
                <h2 class="section-title">Did you see them?</h2>
                <ul class="list">${confirmList}</ul>
              </div>`
            : `<div style="padding-top:1.25rem">
                <p class="week">${formatWeekRange(week)}</p>
                <h2 class="section-title" style="margin-top:0.25rem">Approved visits</h2>
                <ol class="list">${boardList}</ol>
              </div>`;

        return `
          <header class="header">
            <div class="header-inner">
              <a class="brand" href="#">ATR TRACKER</a>
              <div class="header-actions">
                <span class="user-chip">${escapeHtml(me.name)}</span>
                <button class="ghost" data-out>Sign out</button>
              </div>
            </div>
          </header>
          <main>
            <div class="tabs">
              <button class="tab${tab === "confirm" ? " active" : ""}" data-tab="confirm">Confirm</button>
              <button class="tab${tab === "board" ? " active" : ""}" data-tab="board">Leaderboard</button>
            </div>
            ${body}
          </main>`;
      }

      function escapeHtml(s) {
        return String(s)
          .replace(/&/g, "&" + "amp;")
          .replace(/</g, "&" + "lt;")
          .replace(/>/g, "&" + "gt;")
          .replace(/"/g, "&" + "quot;");
      }

      function render() {
        const root = document.getElementById("app");
        const toastHtml = toastMsg ? `<div class="toast">${escapeHtml(toastMsg)}</div>` : "";
        if (screen === "landing") root.innerHTML = renderLanding() + toastHtml;
        else if (screen === "auth") root.innerHTML = renderAuth() + toastHtml;
        else root.innerHTML = renderApp() + toastHtml;

        root.querySelector("[data-go='signup']")?.addEventListener("click", () => {
          authMode = "signup";
          screen = "auth";
          render();
        });
        root.querySelector("[data-go='signin']")?.addEventListener("click", () => {
          authMode = "signin";
          screen = "auth";
          render();
        });
        root.querySelectorAll("[data-home]").forEach((n) =>
          n.addEventListener("click", (e) => {
            e.preventDefault();
            screen = "landing";
            render();
          }),
        );
        root.querySelector("[data-swap]")?.addEventListener("click", () => {
          authMode = authMode === "signup" ? "signin" : "signup";
          render();
        });
        root.querySelector("#auth-form")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const err =
            authMode === "signup"
              ? signUp(fd.get("name"), fd.get("password"))
              : signIn(fd.get("name"), fd.get("password"));
          if (err) toast(err);
        });
        root.querySelector("[data-out]")?.addEventListener("click", signOut);
        root.querySelector("[data-checkin]")?.addEventListener("click", checkIn);
        root.querySelectorAll("[data-tab]").forEach((n) =>
          n.addEventListener("click", () => {
            tab = n.getAttribute("data-tab");
            render();
          }),
        );
        root.querySelectorAll("[data-vote]").forEach((n) =>
          n.addEventListener("click", () => vote(n.getAttribute("data-vote"), n.getAttribute("data-choice"))),
        );
      }

      render();
