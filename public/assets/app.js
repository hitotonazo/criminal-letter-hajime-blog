(() => {
  // This script never exposes a link. It only tries to unlock a session cookie on the server.
  // If you open devtools and run this manually, it still requires server validation + signed cookie.
  const KEY = "k"; // sessionStorage key
  const MAX = 6;
  const PATH = "/api/unlock";

  function load(){
    try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch { return []; }
  }
  function save(arr){
    sessionStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX)));
  }
  async function tryUnlock(arr){
    if(arr.length !== MAX) return;
    try{
      const res = await fetch(PATH, {
        method:"POST",
        headers:{"content-type":"application/json"},
        body: JSON.stringify({ clicks: arr })
      });
      if(!res.ok) return;
      const data = await res.json().catch(()=>null);
      if(data && data.ok){
        // Redirect without ever revealing the hidden URL in DOM.
        location.href = "/hidden/";
      }
    }catch(e){}
  }

  const spots = document.querySelectorAll("[data-s]");
  spots.forEach(el => {
    el.addEventListener("click", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const id = el.getAttribute("data-s");
      let arr = load();
      if(!arr.includes(id)){
        arr.push(id);
        save(arr);
      }
      await tryUnlock(arr);
    }, {passive:false});
  });
})();
