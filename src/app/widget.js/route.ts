import { NextRequest } from "next/server";

/**
 * The embeddable widget loader. Customers drop one script tag on their site:
 *   <script src="https://<app>/widget.js" data-bot-id="<publicId>" async></script>
 * It renders a floating chat bubble that opens the bot in an iframe.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;

  const js = `(function () {
  if (window.__askbaseLoaded) return;
  window.__askbaseLoaded = true;

  var script = document.currentScript || (function () {
    var s = document.querySelectorAll('script[data-bot-id]');
    return s[s.length - 1];
  })();
  var botId = script && script.getAttribute('data-bot-id');
  if (!botId) { console.warn('[AskBase] Missing data-bot-id attribute'); return; }

  var APP = ${JSON.stringify(origin)};
  var accent = '#6366F1';
  var open = false;

  var btn = document.createElement('button');
  btn.setAttribute('aria-label', 'Open chat');
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.22);z-index:2147483000;display:flex;align-items:center;justify-content:center;transition:transform .15s ease;background:' + accent + ';';
  btn.onmouseenter = function () { btn.style.transform = 'scale(1.06)'; };
  btn.onmouseleave = function () { btn.style.transform = 'scale(1)'; };
  btn.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  var frameWrap = document.createElement('div');
  frameWrap.style.cssText = 'position:fixed;bottom:92px;right:24px;width:380px;height:560px;max-height:calc(100vh - 120px);max-width:calc(100vw - 40px);border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.28);z-index:2147483000;display:none;background:#fff;';
  var frame = document.createElement('iframe');
  frame.style.cssText = 'width:100%;height:100%;border:none;';
  frame.title = 'AskBase chat';
  frameWrap.appendChild(frame);

  function closeIcon() {
    btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  }
  function chatIcon() {
    btn.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  }

  btn.onclick = function () {
    open = !open;
    if (open && !frame.src) {
      frame.src = APP + '/embed/' + encodeURIComponent(botId) +
        '?parent=' + encodeURIComponent(location.origin);
    }
    frameWrap.style.display = open ? 'block' : 'none';
    if (open) { closeIcon(); } else { chatIcon(); }
  };

  // Let the iframe tint the launcher with the bot's accent color
  window.addEventListener('message', function (e) {
    if (e.origin !== APP) return;
    var d = e.data || {};
    if (d.type === 'askbase:accent' && typeof d.color === 'string') {
      accent = d.color;
      btn.style.background = accent;
    }
    if (d.type === 'askbase:close') {
      open = false;
      frameWrap.style.display = 'none';
      chatIcon();
    }
  });

  function mount() {
    document.body.appendChild(btn);
    document.body.appendChild(frameWrap);
  }
  if (document.body) { mount(); }
  else { document.addEventListener('DOMContentLoaded', mount); }
})();`;

  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
