(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var orbitStarted = false;
  // ---- Channel orbit: small nodes orbiting a symbolic core ----
  function startOrbit(){
    if (orbitStarted) return;
    var orbitCanvas = document.getElementById('orbit');
    if (!orbitCanvas) return;
    orbitStarted = true;

    var octx = orbitCanvas.getContext('2d');
    var OW = orbitCanvas.width, OH = orbitCanvas.height;
    var cx = OW/2, cy = OH/2, channels = 6;

    function styleColor(name, fallback){
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    }
    var neuralC = styleColor('--neural', '#3E5FBD');
    var lineC = styleColor('--line', 'rgba(22,33,58,0.14)');
    var symbolicC = styleColor('--symbolic', '#C60FAA');
    var ot0 = performance.now();

    function odraw(now){
      var t = (now-ot0)/1000;
      octx.clearRect(0,0,OW,OH);
      octx.strokeStyle = symbolicC;
      octx.lineWidth = 1.8;
      octx.strokeRect(cx-16, cy-16, 32, 32);

      for (var i=0;i<channels;i++){
        var ang = (i/channels)*Math.PI*2 + (reduced?0:t*0.12);
        var rad = OW*0.4;
        var x = cx + Math.cos(ang)*rad, y = cy + Math.sin(ang)*rad;
        octx.strokeStyle = lineC;
        octx.lineWidth = 1;
        octx.beginPath(); octx.moveTo(cx,cy); octx.lineTo(x,y); octx.stroke();
        octx.fillStyle = neuralC;
        octx.beginPath(); octx.arc(x,y,4,0,Math.PI*2); octx.fill();
      }
      if (!reduced) requestAnimationFrame(odraw);
    }
    requestAnimationFrame(odraw);
    if (reduced) odraw(ot0+200);
  }

  startOrbit();
})();

(function(){
  var form = document.getElementById('contactForm');
  if (!form) return;
  var note = document.getElementById('contactFormNote');
  var endpoint = form.getAttribute('action') || '';
  var configured = endpoint.indexOf('YOUR_FORM_ID') === -1;

  function show(msg, ok){
    note.hidden = false;
    note.className = 'contact-form-note' + (ok ? ' is-success' : '');
    note.textContent = msg;
  }
  function fields(){
    return {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      company: form.company.value.trim(),
      message: form.message.value.trim()
    };
  }
  function mailtoFallback(f){
    var subject = 'Inquiry from ' + f.name + ' (' + f.company + ')';
    var body = ['Name: ' + f.name, 'Work email: ' + f.email, 'Company: ' + f.company, '', f.message].join('\n');
    window.location.href = 'mailto:contact@rul.ai?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    show('Opening your email app with the message addressed to contact@rul.ai.', true);
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var f = fields();
    if (!f.name || !f.email || !f.company || !f.message){
      show('Please fill in every field so we can route your message.', false);
      return;
    }
    if (!configured || !window.fetch){ mailtoFallback(f); return; }

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    show('Sending…', true);
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.reset();
      btn.disabled = false;
      show('Thanks. Your message is on its way to contact@rul.ai. We reply within one business day.', true);
    }).catch(function(){
      btn.disabled = false;
      mailtoFallback(f);
    });
  });
})();
