// Mermaid 初始化
document.addEventListener('DOMContentLoaded', function() {
  var mermaidDivs = document.querySelectorAll('div.mermaid');
  if (mermaidDivs.length > 0 && typeof mermaid === 'undefined') {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.onload = function() {
      mermaid.initialize({ 
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'loose',
      });
    };
    document.head.appendChild(script);
  }
});
