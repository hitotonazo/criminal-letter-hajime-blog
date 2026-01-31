(() => {
  // 目に見える「日付」を順番にクリックすると、サーバー側で解放して /hidden/ に入れます。
  const KEY = "k";
  const PATH = "/api/unlock";
  const expected = ["01","02","03","04","05","06"]; // 6記事分（表示順）

  function load(){
    try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch { return []; }
  }
  function save(arr){
    sessionStorage.setItem(KEY, JSON.stringify(arr.slice(0, expected.length)));
  }

  async function tryUnlock(arr){
    if(arr.length !== expected.length) return;
    try{
      const res = await fetch(PATH, {
        method:"POST",
        headers:{"content-type":"application/json"},
        body: JSON.stringify({ clicks: arr })
      });
      if(!res.ok) return;
      const data = await res.json().catch(()=>null);
      if(data && data.ok){
        location.href = "/hidden/";
      }
    }catch(e){}
  }

  const nodes = document.querySelectorAll("[data-s]");
  nodes.forEach(el => {
    el.addEventListener("click", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const id = el.getAttribute("data-s");
      let arr = load();

      // ignore duplicates
      if(arr.includes(id)) return;

      // must match next expected, otherwise wipe
      const next = expected[arr.length];
      if(id !== next){
        save([]);
        return;
      }

      arr.push(id);
      save(arr);
      await tryUnlock(arr);
    }, {passive:false});
  });
})();
