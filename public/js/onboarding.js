// ── Onboarding tutorial ──

let obStep = 0;

export function showOnboarding() {
  if (localStorage.getItem('onboarding_done')) return;
  document.getElementById('onboarding').classList.add('show');
}

export function nextOnboardingStep() {
  obStep++;
  if (obStep > 3) { dismissOnboarding(); return; }
  document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
  document.getElementById('ob-step-' + obStep).classList.add('active');
  document.querySelectorAll('.onboarding-dots .dot').forEach(d => d.classList.toggle('active', parseInt(d.dataset.step) === obStep));
  if (obStep === 3) document.getElementById('ob-next').textContent = 'Get Started ✓';
}

export function dismissOnboarding() {
  document.getElementById('onboarding').classList.remove('show');
  localStorage.setItem('onboarding_done', '1');
}
