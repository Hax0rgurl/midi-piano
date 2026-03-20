🎯 **What:**
This PR fixes a Cross-Site Scripting (XSS) vulnerability in `index.html` within the `#download-midi` click event listener.

⚠️ **Risk:**
The previous implementation used `newWindow.document.write('<pre>' + midiText + '</pre>')`. Because `midiText` comes directly from the user-controllable `document.getElementById('midi-text').value` textarea, an attacker could inject arbitrary HTML and JavaScript. Since `document.write` executes any scripts provided within the string, a malicious payload (e.g., `<script>alert('XSS')</script>`) pasted into the textarea would execute in the context of the newly opened window.

🛡️ **Solution:**
The fix completely removes the dangerous `document.write` call. Instead, it uses secure DOM manipulation: it creates a `<pre>` element via `document.createElement('pre')` and assigns the user's input safely using `pre.textContent = midiText;`. This forces the browser to treat the input purely as text rather than parsing it as HTML, neutralizing any potential script injection and maintaining the desired functionality.
