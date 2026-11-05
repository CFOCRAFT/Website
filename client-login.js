  'use strict';

  (() => {
    /*
      Existing backend contract:
        GET  /api/auth/google/start

        POST /api/auth/otp/start
        {
          phone: "+<country-code><national-number>",
          countryCode: "+<country-code>",
          nationalNumber: "<national-number>",
          country: "<ISO-2>",
          channel: "sms" | "whatsapp"
        }
        -> { challengeId:"...", resendAfterSeconds:30 }

        POST /api/auth/otp/verify
        { challengeId:"...", code:"123456" }
        -> { success:true, redirectUrl:"/client/dashboard" }

      Browser validation is intentionally basic. The server must validate and
      normalize international phone numbers with a proper phone-number library.
      Keep OAuth and SMS/WhatsApp credentials on the server.
    */

    const API_PATH = '/api/auth';
    const API_ORIGIN_META = document.querySelector('meta[name="cfocraft-auth-api-origin"]');

    // Production frontend (Hostinger) and API (Render) are hosted separately.
    // Configure their actual HTTPS backend origin in the HTML meta tag.
    function authApiUrl(path) {
      const configured = API_ORIGIN_META?.content.trim() || '';
      if (!configured) {
        throw new Error('Client login service is not configured yet.');
      }

      let url;
      try { url = new URL(configured); }
      catch { throw new Error('Client login service is not configured correctly.'); }

      const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
      if ((url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) ||
          url.username || url.password || url.search || url.hash) {
        throw new Error('Client login service is not configured correctly.');
      }

      if (url.pathname !== '/' && url.pathname !== '') {
        throw new Error('Set the backend origin only, without /api paths.');
      }
      return url.origin + API_PATH + path;
    }

    function friendlyError(error) {
      if (error?.name === 'AbortError') return 'Request timed out. Please try again.';
      if (error instanceof TypeError) return 'Cannot reach login service. Check your connection and try again.';
      return error?.message || 'Unable to complete the request. Please try again.';
    }
    const COUNTRIES = [{"name":"Afghanistan","iso":"AF","dial":"93"},{"name":"Albania","iso":"AL","dial":"355"},{"name":"Algeria","iso":"DZ","dial":"213"},{"name":"American Samoa","iso":"AS","dial":"1684"},{"name":"Angola","iso":"AO","dial":"244"},{"name":"Anguilla","iso":"AI","dial":"1264"},{"name":"Antigua and Barbuda","iso":"AG","dial":"1268"},{"name":"Argentina","iso":"AR","dial":"54"},{"name":"Armenia","iso":"AM","dial":"374"},{"name":"Aruba","iso":"AW","dial":"297"},{"name":"Australia","iso":"AU","dial":"61"},{"name":"Austria","iso":"AT","dial":"43"},{"name":"Azerbaijan","iso":"AZ","dial":"994"},{"name":"Bahrain","iso":"BH","dial":"973"},{"name":"Bangladesh","iso":"BD","dial":"880"},{"name":"Barbados","iso":"BB","dial":"1246"},{"name":"Belarus","iso":"BY","dial":"375"},{"name":"Belgium","iso":"BE","dial":"32"},{"name":"Belize","iso":"BZ","dial":"501"},{"name":"Benin","iso":"BJ","dial":"229"},{"name":"Bermuda","iso":"BM","dial":"1441"},{"name":"Bhutan","iso":"BT","dial":"975"},{"name":"Bolivia","iso":"BO","dial":"591"},{"name":"Bosnia and Herzegovina","iso":"BA","dial":"387"},{"name":"Botswana","iso":"BW","dial":"267"},{"name":"Brazil","iso":"BR","dial":"55"},{"name":"British Indian Ocean Territory","iso":"IO","dial":"246"},{"name":"Brunei","iso":"BN","dial":"673"},{"name":"Bulgaria","iso":"BG","dial":"359"},{"name":"Burkina Faso","iso":"BF","dial":"226"},{"name":"Burundi","iso":"BI","dial":"257"},{"name":"Cambodia","iso":"KH","dial":"855"},{"name":"Cameroon","iso":"CM","dial":"237"},{"name":"Canada","iso":"CA","dial":"1"},{"name":"Cape Verde","iso":"CV","dial":"238"},{"name":"Cayman Islands","iso":"KY","dial":"1345"},{"name":"Central African Republic","iso":"CF","dial":"236"},{"name":"Chad","iso":"TD","dial":"235"},{"name":"Chile","iso":"CL","dial":"56"},{"name":"China","iso":"CN","dial":"86"},{"name":"Christmas Island","iso":"CX","dial":"61"},{"name":"Cocos (Keeling) Islands","iso":"CC","dial":"61"},{"name":"Colombia","iso":"CO","dial":"57"},{"name":"Comoros","iso":"KM","dial":"269"},{"name":"Cook Islands","iso":"CK","dial":"682"},{"name":"Costa Rica","iso":"CR","dial":"506"},{"name":"Croatia","iso":"HR","dial":"385"},{"name":"Cuba","iso":"CU","dial":"53"},{"name":"Cyprus","iso":"CY","dial":"357"},{"name":"Czech Republic","iso":"CZ","dial":"420"},{"name":"Democratic Republic of the Congo","iso":"CD","dial":"243"},{"name":"Denmark","iso":"DK","dial":"45"},{"name":"Djibouti","iso":"DJ","dial":"253"},{"name":"Dominica","iso":"DM","dial":"1767"},{"name":"Dominican Republic","iso":"DO","dial":"1809"},{"name":"East Timor","iso":"TL","dial":"670"},{"name":"Ecuador","iso":"EC","dial":"593"},{"name":"Egypt","iso":"EG","dial":"20"},{"name":"El Salvador","iso":"SV","dial":"503"},{"name":"Equatorial Guinea","iso":"GQ","dial":"240"},{"name":"Eritrea","iso":"ER","dial":"291"},{"name":"Estonia","iso":"EE","dial":"372"},{"name":"Ethiopia","iso":"ET","dial":"251"},{"name":"Falkland Islands","iso":"FK","dial":"500"},{"name":"Faroe Islands","iso":"FO","dial":"298"},{"name":"Federated States of Micronesia","iso":"FM","dial":"691"},{"name":"Fiji","iso":"FJ","dial":"679"},{"name":"Finland","iso":"FI","dial":"358"},{"name":"France","iso":"FR","dial":"33"},{"name":"French Guiana","iso":"GF","dial":"594"},{"name":"French Polynesia","iso":"PF","dial":"689"},{"name":"Gabon","iso":"GA","dial":"241"},{"name":"Georgia","iso":"GE","dial":"995"},{"name":"Germany","iso":"DE","dial":"49"},{"name":"Ghana","iso":"GH","dial":"233"},{"name":"Gibraltar","iso":"GI","dial":"350"},{"name":"Greece","iso":"GR","dial":"30"},{"name":"Greenland","iso":"GL","dial":"299"},{"name":"Grenada","iso":"GD","dial":"1473"},{"name":"Guadeloupe","iso":"GP","dial":"590"},{"name":"Guam","iso":"GU","dial":"1671"},{"name":"Guatemala","iso":"GT","dial":"502"},{"name":"Guernsey","iso":"GG","dial":"44"},{"name":"Guinea","iso":"GN","dial":"224"},{"name":"Guinea-Bissau","iso":"GW","dial":"245"},{"name":"Guyana","iso":"GY","dial":"592"},{"name":"Haiti","iso":"HT","dial":"509"},{"name":"Honduras","iso":"HN","dial":"504"},{"name":"Hong Kong","iso":"HK","dial":"852"},{"name":"Hungary","iso":"HU","dial":"36"},{"name":"Iceland","iso":"IS","dial":"354"},{"name":"India","iso":"IN","dial":"91"},{"name":"Indonesia","iso":"ID","dial":"62"},{"name":"Iran","iso":"IR","dial":"98"},{"name":"Iraq","iso":"IQ","dial":"964"},{"name":"Ireland","iso":"IE","dial":"353"},{"name":"Isle of Man","iso":"IM","dial":"44"},{"name":"Israel","iso":"IL","dial":"972"},{"name":"Italy","iso":"IT","dial":"39"},{"name":"Ivory Coast","iso":"CI","dial":"225"},{"name":"Jamaica","iso":"JM","dial":"1876"},{"name":"Japan","iso":"JP","dial":"81"},{"name":"Jersey","iso":"JE","dial":"44"},{"name":"Jordan","iso":"JO","dial":"962"},{"name":"Kazakhstan","iso":"KZ","dial":"76"},{"name":"Kenya","iso":"KE","dial":"254"},{"name":"Kiribati","iso":"KI","dial":"686"},{"name":"Kosovo","iso":"XK","dial":"383"},{"name":"Kuwait","iso":"KW","dial":"965"},{"name":"Kyrgyzstan","iso":"KG","dial":"996"},{"name":"Laos","iso":"LA","dial":"856"},{"name":"Latvia","iso":"LV","dial":"371"},{"name":"Lebanon","iso":"LB","dial":"961"},{"name":"Lesotho","iso":"LS","dial":"266"},{"name":"Liberia","iso":"LR","dial":"231"},{"name":"Libya","iso":"LY","dial":"218"},{"name":"Liechtenstein","iso":"LI","dial":"423"},{"name":"Lithuania","iso":"LT","dial":"370"},{"name":"Luxembourg","iso":"LU","dial":"352"},{"name":"Macau","iso":"MO","dial":"853"},{"name":"Madagascar","iso":"MG","dial":"261"},{"name":"Malawi","iso":"MW","dial":"265"},{"name":"Malaysia","iso":"MY","dial":"60"},{"name":"Maldives","iso":"MV","dial":"960"},{"name":"Mali","iso":"ML","dial":"223"},{"name":"Malta","iso":"MT","dial":"356"},{"name":"Marshall Islands","iso":"MH","dial":"692"},{"name":"Martinique","iso":"MQ","dial":"596"},{"name":"Mauritania","iso":"MR","dial":"222"},{"name":"Mauritius","iso":"MU","dial":"230"},{"name":"Mayotte","iso":"YT","dial":"262"},{"name":"Mexico","iso":"MX","dial":"52"},{"name":"Moldova","iso":"MD","dial":"373"},{"name":"Monaco","iso":"MC","dial":"377"},{"name":"Mongolia","iso":"MN","dial":"976"},{"name":"Montserrat","iso":"MS","dial":"1664"},{"name":"Morocco","iso":"MA","dial":"212"},{"name":"Mozambique","iso":"MZ","dial":"258"},{"name":"Namibia","iso":"NA","dial":"264"},{"name":"Nauru","iso":"NR","dial":"674"},{"name":"Nepal","iso":"NP","dial":"977"},{"name":"Netherlands","iso":"NL","dial":"31"},{"name":"New Caledonia","iso":"NC","dial":"687"},{"name":"New Zealand","iso":"NZ","dial":"64"},{"name":"Nicaragua","iso":"NI","dial":"505"},{"name":"Niger","iso":"NE","dial":"227"},{"name":"Nigeria","iso":"NG","dial":"234"},{"name":"Niue","iso":"NU","dial":"683"},{"name":"Norfolk Island","iso":"NF","dial":"672"},{"name":"North Korea","iso":"KP","dial":"850"},{"name":"Northern Mariana Islands","iso":"MP","dial":"1670"},{"name":"Norway","iso":"NO","dial":"47"},{"name":"Oman","iso":"OM","dial":"968"},{"name":"Pakistan","iso":"PK","dial":"92"},{"name":"Palau","iso":"PW","dial":"680"},{"name":"Panama","iso":"PA","dial":"507"},{"name":"Papua New Guinea","iso":"PG","dial":"675"},{"name":"Paraguay","iso":"PY","dial":"595"},{"name":"Peru","iso":"PE","dial":"51"},{"name":"Philippines","iso":"PH","dial":"63"},{"name":"Pitcairn Islands","iso":"PN","dial":"64"},{"name":"Poland","iso":"PL","dial":"48"},{"name":"Portugal","iso":"PT","dial":"351"},{"name":"Puerto Rico","iso":"PR","dial":"1787"},{"name":"Qatar","iso":"QA","dial":"974"},{"name":"Republic of Macedonia","iso":"MK","dial":"389"},{"name":"Republic of the Congo","iso":"CG","dial":"242"},{"name":"Romania","iso":"RO","dial":"40"},{"name":"Russia","iso":"RU","dial":"7"},{"name":"Rwanda","iso":"RW","dial":"250"},{"name":"Réunion","iso":"RE","dial":"262"},{"name":"Saint Helena","iso":"SH","dial":"290"},{"name":"Saint Kitts and Nevis","iso":"KN","dial":"1869"},{"name":"Saint Lucia","iso":"LC","dial":"1758"},{"name":"Saint Pierre and Miquelon","iso":"PM","dial":"508"},{"name":"Saint Vincent and the Grenadines","iso":"VC","dial":"1784"},{"name":"Samoa","iso":"WS","dial":"685"},{"name":"San Marino","iso":"SM","dial":"378"},{"name":"Saudi Arabia","iso":"SA","dial":"966"},{"name":"Senegal","iso":"SN","dial":"221"},{"name":"Serbia","iso":"RS","dial":"381"},{"name":"Seychelles","iso":"SC","dial":"248"},{"name":"Sierra Leone","iso":"SL","dial":"232"},{"name":"Singapore","iso":"SG","dial":"65"},{"name":"Slovakia","iso":"SK","dial":"421"},{"name":"Slovenia","iso":"SI","dial":"386"},{"name":"Solomon Islands","iso":"SB","dial":"677"},{"name":"Somalia","iso":"SO","dial":"252"},{"name":"South Africa","iso":"ZA","dial":"27"},{"name":"South Georgia","iso":"GS","dial":"500"},{"name":"South Korea","iso":"KR","dial":"82"},{"name":"South Sudan","iso":"SS","dial":"211"},{"name":"Spain","iso":"ES","dial":"34"},{"name":"Sri Lanka","iso":"LK","dial":"94"},{"name":"Sudan","iso":"SD","dial":"249"},{"name":"Suriname","iso":"SR","dial":"597"},{"name":"Svalbard and Jan Mayen","iso":"SJ","dial":"4779"},{"name":"Swaziland","iso":"SZ","dial":"268"},{"name":"Sweden","iso":"SE","dial":"46"},{"name":"Switzerland","iso":"CH","dial":"41"},{"name":"Syria","iso":"SY","dial":"963"},{"name":"São Tomé and Príncipe","iso":"ST","dial":"239"},{"name":"Taiwan","iso":"TW","dial":"886"},{"name":"Tajikistan","iso":"TJ","dial":"992"},{"name":"Tanzania","iso":"TZ","dial":"255"},{"name":"Thailand","iso":"TH","dial":"66"},{"name":"The Bahamas","iso":"BS","dial":"1242"},{"name":"The Gambia","iso":"GM","dial":"220"},{"name":"Togo","iso":"TG","dial":"228"},{"name":"Tokelau","iso":"TK","dial":"690"},{"name":"Tonga","iso":"TO","dial":"676"},{"name":"Trinidad and Tobago","iso":"TT","dial":"1868"},{"name":"Tunisia","iso":"TN","dial":"216"},{"name":"Turkey","iso":"TR","dial":"90"},{"name":"Turkmenistan","iso":"TM","dial":"993"},{"name":"Tuvalu","iso":"TV","dial":"688"},{"name":"Uganda","iso":"UG","dial":"256"},{"name":"Ukraine","iso":"UA","dial":"380"},{"name":"United Arab Emirates","iso":"AE","dial":"971"},{"name":"United Kingdom","iso":"GB","dial":"44"},{"name":"United States","iso":"US","dial":"1"},{"name":"Uruguay","iso":"UY","dial":"598"},{"name":"Uzbekistan","iso":"UZ","dial":"998"},{"name":"Vanuatu","iso":"VU","dial":"678"},{"name":"Venezuela","iso":"VE","dial":"58"},{"name":"Vietnam","iso":"VN","dial":"84"},{"name":"Wallis and Futuna","iso":"WF","dial":"681"},{"name":"Western Sahara","iso":"EH","dial":"212"},{"name":"Yemen","iso":"YE","dial":"967"},{"name":"Zambia","iso":"ZM","dial":"260"},{"name":"Zimbabwe","iso":"ZW","dial":"263"}];

    const checkingView = document.getElementById('checking-view');
    const continueView = document.getElementById('continue-view');
    const signedInView = document.getElementById('signed-in-view');
    const continueEmail = document.getElementById('continue-email');
    const signedInEmail = document.getElementById('signed-in-email');
    const continueBtn = document.getElementById('continue-btn');
    const continueLogoutBtn = document.getElementById('continue-logout-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const continueStatus = document.getElementById('continue-status');
    const signedInStatus = document.getElementById('signed-in-status');
    const loginTitle = document.getElementById('login-title');
    const loginSubtitle = document.getElementById('login-subtitle');
    const showcaseSection = document.getElementById('showcase-section');
    const providerView = document.getElementById('provider-view');
    const phoneView = document.getElementById('phone-view');
    const otpView = document.getElementById('otp-view');

    const showPhoneBtn = document.getElementById('show-phone-btn');
    const showProviderBtn = document.getElementById('show-provider-btn');
    const googleBtn = document.getElementById('google-btn');
    const emailBtn = document.getElementById('email-btn');
    const emailView = document.getElementById('email-view');
    const emailOtpView = document.getElementById('email-otp-view');
    const emailForm = document.getElementById('email-form');
    const emailAddress = document.getElementById('email-address');
    const emailStatus = document.getElementById('email-status');
    const sendEmailOtpBtn = document.getElementById('send-email-otp-btn');
    const emailBackBtn = document.getElementById('email-back-btn');
    const emailOtpForm = document.getElementById('email-otp-form');
    const emailOtpCode = document.getElementById('email-otp-code');
    const emailOtpDestination = document.getElementById('email-otp-destination');
    const emailOtpStatus = document.getElementById('email-otp-status');
    const verifyEmailOtpBtn = document.getElementById('verify-email-otp-btn');
    const changeEmailBtn = document.getElementById('change-email-btn');
    const resendEmailOtpBtn = document.getElementById('resend-email-otp-btn');
    const emailResendCountdown = document.getElementById('email-resend-countdown');
    const emailState = {email:'',challengeId:'',until:0,timer:null};
    const providerStatus = document.getElementById('provider-status');

    const phoneForm = document.getElementById('phone-form');
    const phoneInput = document.getElementById('phone');
    const smsBtn = document.getElementById('sms-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const phoneStatus = document.getElementById('phone-status');

    const countryWrap = document.getElementById('country-select-wrap');
    const countryTrigger = document.getElementById('country-select-trigger');
    const countryMenu = document.getElementById('country-menu');
    const countrySearchInput = document.getElementById('country-search-input');
    const countryList = document.getElementById('country-list');
    const selectedCountryIso = document.getElementById('selected-country-iso');
    const selectedCountryDial = document.getElementById('selected-country-dial');

    const otpForm = document.getElementById('otp-form');
    const otpCode = document.getElementById('otp-code');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const otpDestination = document.getElementById('otp-destination');
    const otpStatus = document.getElementById('otp-status');
    const changeNumberBtn = document.getElementById('change-number-btn');
    const resendBtn = document.getElementById('resend-btn');
    const resendCountdown = document.getElementById('resend-countdown');

    const defaultCountry = COUNTRIES.find((country) => country.iso === 'IN') || COUNTRIES[0];

    const state = {
      channel: 'sms',
      country: defaultCountry,
      phone: '',
      nationalNumber: '',
      challengeId: '',
      cooldownUntil: 0,
      cooldownTimer: null
    };


    function show(view) {
      checkingView.hidden = view !== 'checking';
      providerView.hidden = view !== 'provider';
      emailView.hidden = view !== 'email';
      emailOtpView.hidden = view !== 'email-otp';
      phoneView.hidden = view !== 'phone';
      otpView.hidden = view !== 'otp';
      continueView.hidden = view !== 'continue';
      signedInView.hidden = view !== 'signed-in';
      const authenticatedScreen = view === 'continue' || view === 'signed-in';
      showcaseSection.hidden = authenticatedScreen;
      loginTitle.hidden = authenticatedScreen;
      loginSubtitle.hidden = authenticatedScreen;
      loginTitle.textContent = authenticatedScreen ? 'Your CFO CRAFT account' : 'Your Business. Your Numbers. Your Edge.';
      loginSubtitle.textContent = authenticatedScreen
        ? "You're securely connected to CFO CRAFT."
        : 'Your financial workspace, built for clarity, control and confident decisions.';
      closeCountryMenu();
    }

    function setStatus(el, message = '', type = '') {
      el.textContent = message;
      el.className = 'auth-status' + (type ? ' ' + type : '');
    }

    function setChannel(channel) {
      state.channel = channel;
      const sms = channel === 'sms';

      smsBtn.classList.toggle('is-active', sms);
      whatsappBtn.classList.toggle('is-active', !sms);
      smsBtn.setAttribute('aria-pressed', String(sms));
      whatsappBtn.setAttribute('aria-pressed', String(!sms));
    }

    function updateCountryTrigger() {
      selectedCountryIso.textContent = state.country.iso;
      selectedCountryDial.textContent = '+' + state.country.dial;

      const maxNationalDigits = Math.max(4, 15 - state.country.dial.length);
      phoneInput.maxLength = maxNationalDigits;
      phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, maxNationalDigits);
    }

    function renderCountries(query = '') {
      const term = query.trim().toLowerCase();

      const filtered = COUNTRIES.filter((country) => {
        if (!term) return true;
        return (
          country.name.toLowerCase().includes(term) ||
          country.iso.toLowerCase().includes(term) ||
          ('+' + country.dial).includes(term.replace(/\s/g, ''))
        );
      });

      countryList.innerHTML = '';

      filtered.forEach((country) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'country-option' + (country.iso === state.country.iso ? ' is-selected' : '');
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(country.iso === state.country.iso));

        option.innerHTML = `
          <span class="country-option-iso" aria-hidden="true">${country.iso}</span>
          <span class="country-option-name">${country.name}</span>
          <span class="country-option-code">+${country.dial}</span>
        `;

        option.addEventListener('click', () => {
          state.country = country;
          updateCountryTrigger();
          setStatus(phoneStatus);
          phoneInput.setAttribute('aria-invalid', 'false');
          closeCountryMenu();
          phoneInput.focus();
        });

        countryList.appendChild(option);
      });

      if (!filtered.length) {
        const empty = document.createElement('p');
        empty.className = 'country-empty';
        empty.textContent = 'No country found';
        countryList.appendChild(empty);
      }
    }

    function openCountryMenu() {
      countryMenu.hidden = false;
      countryTrigger.setAttribute('aria-expanded', 'true');
      renderCountries(countrySearchInput.value);
      window.setTimeout(() => countrySearchInput.focus(), 0);
    }

    function closeCountryMenu() {
      countryMenu.hidden = true;
      countryTrigger.setAttribute('aria-expanded', 'false');
      countrySearchInput.value = '';
    }

    function sanitizeNationalNumber() {
      const maxNationalDigits = Math.max(4, 15 - state.country.dial.length);
      const digits = phoneInput.value.replace(/\D/g, '').slice(0, maxNationalDigits);
      phoneInput.value = digits;
      return digits;
    }

    function buildPhonePayload() {
      const nationalNumber = sanitizeNationalNumber();
      if (!nationalNumber || nationalNumber.length < 6) return null;

      // India and NANP numbers get a useful client-side sanity check.
      // The backend must perform authoritative country-aware validation.
      if (state.country.iso === 'IN' && !/^[6-9]\d{9}$/.test(nationalNumber)) return null;
      if (['US', 'CA'].includes(state.country.iso) && !/^\d{10}$/.test(nationalNumber)) return null;

      const e164Digits = state.country.dial + nationalNumber;
      if (e164Digits.length > 15) return null;

      return {
        phone: '+' + e164Digits,
        countryCode: '+' + state.country.dial,
        nationalNumber,
        country: state.country.iso
      };
    }

    function maskPhone() {
      const tail = state.nationalNumber.slice(-4);
      return `${state.country.iso} +${state.country.dial} •••• ${tail}`;
    }

    async function post(path, body) {
      const url = authApiUrl(path);
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        const payload = response.headers.get('content-type')?.includes('application/json')
          ? await response.json().catch(() => ({}))
          : {};

        if (!response.ok) {
          if (response.status === 429) throw new Error('Too many attempts. Please wait before retrying.');
          if (path === '/email/verify' && response.status === 401) {
            throw new Error('Invalid or expired verification code.');
          }
          if (response.status === 401 || response.status === 403) {
            throw new Error('Login not authorized. Please contact CFO CRAFT if you need access.');
          }
          if (response.status === 404) throw new Error('Login service endpoint is not available yet.');
          if (response.status >= 500) throw new Error('Login service is temporarily unavailable. Please try later.');
          throw new Error(typeof payload.message === 'string' && payload.message.length <= 180
            ? payload.message : 'Unable to complete the request. Please check your details.');
        }
        return payload;
      } finally {
        clearTimeout(timer);
      }
    }

    // Backend session is authoritative: an `auth=success` URL alone is NOT proof of login.
    async function getSession() {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(authApiUrl('/me'), {
          method: 'GET', mode: 'cors', credentials: 'include',
          cache: 'no-store', headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        if (response.status === 401) return null;
        if (!response.ok) throw new Error('Cannot verify your session right now. Please try again.');
        const body = await response.json();
        if (body.authenticated !== true || !body.client || !body.client.id) return null;
        if (typeof body.client.onboardingComplete !== 'boolean') {
          throw new Error('Sign-in update is not deployed on the backend yet.');
        }
        return body.client;
      } finally {
        window.clearTimeout(timeout);
      }
    }

    function displayClient(client) {
      const email = typeof client.email === 'string' && client.email
        ? client.email : (client.phone || 'Verified account');
      if (client.onboardingComplete) {
        signedInEmail.textContent = email;
        show('signed-in');
      } else {
        continueEmail.textContent = email;
        show('continue');
      }
    }

    function clearAuthQuery() {
      const url = new URL(window.location.href);
      if (!url.searchParams.has('auth') && !url.searchParams.has('login_error')) return;
      url.searchParams.delete('auth');
      url.searchParams.delete('login_error');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }

    async function refreshSession() {
      show('checking');
      try {
        const client = await getSession();
        if (client) {
          displayClient(client);
        } else {
          show('provider');
          const query = new URLSearchParams(window.location.search);
          if (query.get('auth') === 'error') {
            setStatus(providerStatus, 'Sign-in could not be completed. Please try again.', 'error');
          } else if (query.get('auth') === 'success') {
            setStatus(providerStatus, 'Your sign-in session could not be confirmed. Please sign in again.', 'error');
          }
        }
        clearAuthQuery();
      } catch (error) {
        show('provider');
        setStatus(providerStatus, friendlyError(error), 'error');
      }
    }

    continueBtn.addEventListener('click', async () => {
      if (continueBtn.disabled) return;
      continueBtn.disabled = true;
      setStatus(continueStatus, 'Finishing setup…');
      try {
        const result = await post('/onboarding/complete', {});
        if (result.success !== true) throw new Error('Account setup could not be completed.');
        const client = await getSession();
        if (!client || !client.onboardingComplete) throw new Error('Could not confirm account setup.');
        setStatus(continueStatus);
        displayClient(client);
      } catch (error) {
        setStatus(continueStatus, friendlyError(error), 'error');
      } finally {
        continueBtn.disabled = false;
      }
    });

    async function logOut() {
      logoutBtn.disabled = true;
      continueLogoutBtn.disabled = true;
      setStatus(signedInStatus, 'Signing out…');
      setStatus(continueStatus);
      try {
        const result = await post('/logout', {});
        if (result.success !== true) throw new Error('Logout could not be confirmed.');
        setStatus(signedInStatus);
        clearAuthQuery();
        setStatus(providerStatus, 'You have signed out.', 'success');
        show('provider');
      } catch (error) {
        setStatus(signedInStatus, friendlyError(error), 'error');
        setStatus(continueStatus, friendlyError(error), 'error');
      } finally {
        logoutBtn.disabled = false;
        continueLogoutBtn.disabled = false;
      }
    }
    logoutBtn.addEventListener('click', logOut);
    continueLogoutBtn.addEventListener('click', logOut);

    function startProvider(provider, button) {
      try {
        button.disabled = true;
        setStatus(providerStatus, 'Opening secure sign-in…');
        window.location.assign(authApiUrl('/' + provider + '/start'));
      } catch (error) {
        button.disabled = false;
        setStatus(providerStatus, friendlyError(error), 'error');
      }
    }

    function startCooldown(seconds = 30) {
      clearInterval(state.cooldownTimer);
      state.cooldownUntil = Date.now() + seconds * 1000;

      const tick = () => {
        const left = Math.max(0, Math.ceil((state.cooldownUntil - Date.now()) / 1000));
        resendCountdown.textContent = left ? `Resend in ${left}s` : '';
        resendBtn.disabled = left > 0;
      };

      tick();
      state.cooldownTimer = setInterval(tick, 1000);
    }

    countryTrigger.addEventListener('click', () => {
      countryMenu.hidden ? openCountryMenu() : closeCountryMenu();
    });

    countrySearchInput.addEventListener('input', () => {
      renderCountries(countrySearchInput.value);
    });

    document.addEventListener('click', (event) => {
      if (!countryWrap.contains(event.target)) closeCountryMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !countryMenu.hidden) {
        closeCountryMenu();
        countryTrigger.focus();
      }
    });

    showPhoneBtn.addEventListener('click', () => {
      setStatus(providerStatus);
      show('phone');
      phoneInput.focus();
    });

    showProviderBtn.addEventListener('click', () => {
      setStatus(providerStatus);
      show('provider');
      setStatus(phoneStatus);
    });

    googleBtn.addEventListener('click', () => startProvider('google', googleBtn));
    emailBtn.addEventListener('click', () => {
      setStatus(providerStatus);
      setStatus(emailStatus);
      show('email');
      emailAddress.focus();
    });
    emailBackBtn.addEventListener('click', () => {show('provider');setStatus(emailStatus);});
    changeEmailBtn.addEventListener('click', () => {
      clearInterval(emailState.timer);
      emailState.challengeId = '';
      emailOtpCode.value = '';
      setStatus(emailOtpStatus);
      show('email');
      emailAddress.focus();
    });
    emailAddress.addEventListener('input', () => {
      emailAddress.setAttribute('aria-invalid', 'false');
      setStatus(emailStatus);
    });
    emailOtpCode.addEventListener('input', () => {
      emailOtpCode.value = emailOtpCode.value.replace(/\D/g, '').slice(0, 6);
      emailOtpCode.setAttribute('aria-invalid', 'false');
      setStatus(emailOtpStatus);
    });
    function emailCooldown(seconds = 30) {
      clearInterval(emailState.timer);
      emailState.until = Date.now() + seconds * 1000;
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((emailState.until - Date.now()) / 1000));
        emailResendCountdown.textContent = remaining ? `Resend in ${remaining}s` : '';
        resendEmailOtpBtn.disabled = remaining > 0;
      };
      tick();
      emailState.timer = setInterval(tick, 1000);
    }
    async function requestEmailOtp(email) {
      const data = await post('/email/start', {email});
      if (!data.challengeId) throw new Error('Invalid email verification response.');
      emailState.email = email;
      emailState.challengeId = data.challengeId;
      emailOtpDestination.textContent = `Code sent to ${email}`;
      emailOtpCode.value = '';
      emailOtpCode.setAttribute('aria-invalid', 'false');
      setStatus(emailOtpStatus);
      emailCooldown(Number(data.resendAfterSeconds) || 30);
      show('email-otp');
      emailOtpCode.focus();
    }
    emailForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (sendEmailOtpBtn.disabled) return;
      const email = emailAddress.value.trim().toLowerCase();
      if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(email)) {
        emailAddress.setAttribute('aria-invalid','true');
        setStatus(emailStatus,'Enter a valid email address.','error');
        emailAddress.focus();return;
      }
      sendEmailOtpBtn.disabled = true;
      sendEmailOtpBtn.textContent = 'Sending…';
      setStatus(emailStatus);
      try { await requestEmailOtp(email); }
      catch (error) {setStatus(emailStatus,friendlyError(error),'error');}
      finally {sendEmailOtpBtn.disabled=false;sendEmailOtpBtn.textContent='Send OTP';}
    });
    emailOtpForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (verifyEmailOtpBtn.disabled) return;
      const code = emailOtpCode.value.replace(/\D/g,'');
      if (!/^\d{6}$/.test(code) || !emailState.challengeId) {
        emailOtpCode.setAttribute('aria-invalid','true');
        setStatus(emailOtpStatus,'Enter the complete 6-digit code.','error');
        return;
      }
      verifyEmailOtpBtn.disabled = true;
      verifyEmailOtpBtn.textContent = 'Verifying…';
      setStatus(emailOtpStatus);
      try {
        const result = await post('/email/verify',{challengeId:emailState.challengeId,code});
        if (result.success !== true) throw new Error('Unable to verify email code.');
        const client = await getSession();
        if (!client) throw new Error('Code accepted but session could not be confirmed. Please sign in again.');
        emailState.challengeId = '';
        clearInterval(emailState.timer);
        displayClient(client);
      } catch (error) {setStatus(emailOtpStatus,friendlyError(error),'error');}
      finally {verifyEmailOtpBtn.disabled=false;verifyEmailOtpBtn.textContent='Verify';}
    });
    resendEmailOtpBtn.addEventListener('click',async () => {
      if (!emailState.email || resendEmailOtpBtn.disabled) return;
      resendEmailOtpBtn.disabled = true;
      setStatus(emailOtpStatus,'Sending a new code…');
      try {await requestEmailOtp(emailState.email);}
      catch (error) {
        setStatus(emailOtpStatus,friendlyError(error),'error');
        resendEmailOtpBtn.disabled = emailState.until > Date.now();
      }
    });

    phoneInput.addEventListener('input', () => {
      sanitizeNationalNumber();
      phoneInput.setAttribute('aria-invalid', 'false');
      setStatus(phoneStatus);
    });

    smsBtn.addEventListener('click', () => setChannel('sms'));
    whatsappBtn.addEventListener('click', () => setChannel('whatsapp'));

    phoneForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (sendOtpBtn.disabled) return;
      setStatus(phoneStatus);

      const phonePayload = buildPhonePayload();

      if (!phonePayload) {
        setStatus(phoneStatus, state.country.iso === 'IN' ? 'Enter a valid 10-digit Indian mobile number (starting 6–9).' : 'Enter a valid phone number for the selected country.', 'error');
        phoneInput.setAttribute('aria-invalid', 'true');
        phoneInput.focus();
        return;
      }

      sendOtpBtn.disabled = true;
      sendOtpBtn.textContent = 'Sending…';

      try {
        const result = await post('/otp/start', {
          ...phonePayload,
          channel: state.channel
        });

        if (!result.challengeId) throw new Error('Invalid response from verification service.');

        state.phone = phonePayload.phone;
        state.nationalNumber = phonePayload.nationalNumber;
        state.challengeId = result.challengeId;

        const channelName = state.channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
        otpDestination.textContent = `${channelName} · ${maskPhone()}`;

        show('otp');
        otpCode.value = '';
        otpCode.focus();
        startCooldown(Number(result.resendAfterSeconds) || 30);
      } catch (error) {
        setStatus(phoneStatus, friendlyError(error), 'error');
      } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
      }
    });

    otpCode.addEventListener('input', () => {
      otpCode.value = otpCode.value.replace(/\D/g, '').slice(0, 6);
      otpCode.setAttribute('aria-invalid', 'false');
      setStatus(otpStatus);
    });

    otpForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (verifyOtpBtn.disabled) return;
      setStatus(otpStatus);

      const code = otpCode.value.replace(/\D/g, '');
      if (!/^\d{6}$/.test(code) || !state.challengeId) {
        setStatus(otpStatus, 'Enter the complete 6-digit code.', 'error');
        otpCode.setAttribute('aria-invalid', 'true');
        otpCode.focus();
        return;
      }

      verifyOtpBtn.disabled = true;
      verifyOtpBtn.textContent = 'Verifying…';

      try {
        const result = await post('/otp/verify', {
          challengeId: state.challengeId,
          code
        });

        if (result.success !== true) throw new Error('Verification failed. Please try again.');

        // After OTP, show the same first-time/returning-account state as Google.
        // Do not send users to a dashboard route that may not exist yet.
        const client = await getSession();
        if (!client) throw new Error('Code verified, but your session could not be confirmed. Please sign in again.');
        state.challengeId = '';
        displayClient(client);
      } catch (error) {
        setStatus(otpStatus, friendlyError(error), 'error');
      } finally {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify';
      }
    });

    changeNumberBtn.addEventListener('click', () => {
      clearInterval(state.cooldownTimer);
      show('phone');
      otpCode.value = '';
      setStatus(otpStatus);
      phoneInput.focus();
    });

    resendBtn.addEventListener('click', async () => {
      if (!state.phone || resendBtn.disabled) return;

      resendBtn.disabled = true;

      try {
        const result = await post('/otp/start', {
          phone: state.phone,
          countryCode: '+' + state.country.dial,
          nationalNumber: state.nationalNumber,
          country: state.country.iso,
          channel: state.channel,
          resend: true
        });

        if (!result.challengeId) throw new Error('Unable to request another code. Please try again.');
        state.challengeId = result.challengeId;

        startCooldown(Number(result.resendAfterSeconds) || 30);
        setStatus(otpStatus, 'A new code has been requested.', 'success');
      } catch (error) {
        setStatus(otpStatus, friendlyError(error), 'error');
        resendBtn.disabled = state.cooldownUntil > Date.now();
      }
    });

    const cards = [...document.querySelectorAll('.showcase-card')];
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    let activeIndex = 1;
    let autoTimer = null;

    function renderCarousel() {
      const total = cards.length;

      cards.forEach((card, index) => {
        card.classList.remove('is-active', 'is-prev', 'is-next');

        if (index === activeIndex) {
          card.classList.add('is-active');
        } else if (index === (activeIndex - 1 + total) % total) {
          card.classList.add('is-prev');
        } else if (index === (activeIndex + 1) % total) {
          card.classList.add('is-next');
        }
      });
    }

    function move(direction) {
      activeIndex = (activeIndex + direction + cards.length) % cards.length;
      renderCarousel();
    }

    function restartAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => move(1), 4200);
    }

    prevBtn.addEventListener('click', () => {
      move(-1);
      restartAuto();
    });

    nextBtn.addEventListener('click', () => {
      move(1);
      restartAuto();
    });

    cards.forEach((card, index) => {
      card.addEventListener('click', () => {
        if (index !== activeIndex) {
          activeIndex = index;
          renderCarousel();
          restartAuto();
        }
      });
    });

    updateCountryTrigger();
    setChannel('sms');
    renderCarousel();
    restartAuto();

    const loginError = new URLSearchParams(window.location.search).get('login_error');
    if (loginError) {
      const publicMessages = {
        access_denied: 'Sign-in was cancelled. You can try again.',
        unauthorized: 'This account is not authorized for the CFO CRAFT client portal.',
        provider_error: 'Sign-in service is temporarily unavailable. Please try again.',
        invalid_state: 'Your sign-in session expired. Please start again.'
      };
      setStatus(providerStatus, publicMessages[loginError] || 'Sign-in could not be completed. Please try again.', 'error');
    }
    refreshSession();
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) refreshSession();
    });
  })();
