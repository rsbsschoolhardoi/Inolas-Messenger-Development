import React from 'react';

export type NearwaysDocType = 'privacypolicy' | 'termsofservice';

interface NearwaysLegalPageProps {
  initialDoc?: NearwaysDocType;
  docType?: NearwaysDocType;
}

export const NearwaysLegalPage: React.FC<NearwaysLegalPageProps> = ({
  initialDoc = 'privacypolicy',
  docType
}) => {
  // Determine which document to render based on URL path or prop
  const currentDoc: NearwaysDocType = (() => {
    if (docType) return docType;
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('termsofservice') || p.includes('terms')) return 'termsofservice';
      if (p.includes('privacypolicy') || p.includes('privacy')) return 'privacypolicy';
    }
    return initialDoc;
  })();

  return (
    <div className="min-h-screen bg-white text-[#1f2937] antialiased">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* ========================================================================= */}
        {/* PRIVACY POLICY FOR NEARWAYS (Exact text provided by user)                  */}
        {/* ========================================================================= */}
        {currentDoc === 'privacypolicy' && (
          <main className="space-y-6 text-[15px] sm:text-base leading-relaxed text-[#374151]">
            <header className="space-y-2 pb-4 border-b border-gray-200">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Privacy Policy for Nearways
              </h1>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p><strong>Effective Date:</strong> September 24, 2026</p>
                <p><strong>Publisher:</strong> INOLAS</p>
                <p><strong>Contact Email:</strong> <a href="mailto:azadtechnologies19@gmail.com" className="text-blue-600 hover:underline">azadtechnologies19@gmail.com</a></p>
                <p><strong>Application:</strong> Nearways: Offline Share &amp; Chat (Android)</p>
              </div>
            </header>

            <section className="space-y-3 pt-2">
              <h2 className="text-xl font-bold text-gray-900">1. Introduction</h2>
              <p>
                Welcome to <strong>Nearways</strong>, engineered and published by <strong>INOLAS</strong> ("we", "our", or "us"). We believe privacy is a fundamental human right. Nearways was designed from the ground up with a <strong>Privacy-by-Design and Privacy-by-Default</strong> architecture.
              </p>
              <p>
                This Privacy Policy explains how Nearways operates, why we do not collect your personal data, how device permissions are utilized strictly on-device, and how your privacy is protected during local offline peer-to-peer (P2P) communication and file transfers.
              </p>
              <p>
                By downloading, installing, or using Nearways, you acknowledge and agree to the practices described in this Privacy Policy.
              </p>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">2. Zero-Cloud &amp; Zero-Data-Collection Principle</h2>
              <p>
                Nearways operates as a <strong>100% decentralized, local offline utility</strong>.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>No Remote Servers:</strong> We do not operate external web servers, cloud databases, user tracking systems, or telemetry backends for Nearways.
                </li>
                <li>
                  <strong>No User Accounts:</strong> You are never required to provide your legal name, email address, phone number, passwords, or social media credentials to use Nearways.
                </li>
                <li>
                  <strong>No Cloud Message Storage:</strong> Chat messages, voice notes, transfer logs, and media files are transmitted directly between physical devices over local Wi-Fi Direct, Local Area Networks (LAN), or local Bluetooth sockets. They never touch an intermediary cloud server.
                </li>
                <li>
                  <strong>No Analytics or Trackers:</strong> Nearways contains zero third-party advertising SDKs, zero user tracking libraries (such as Google Firebase Analytics, Facebook Pixel, or Adjust), and zero automated crash-harvesting tools that collect personal device data.
                </li>
              </ul>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">3. Operating System Permissions and Purpose</h2>
              <p>
                To facilitate offline discovery and local high-speed file transfer, Android requires applications to request specific hardware permissions. Nearways uses these permissions strictly for real-time local functionality:
              </p>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900">
                    A. Bluetooth &amp; Nearby Devices (<code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">BLUETOOTH_SCAN</code>, <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">BLUETOOTH_ADVERTISE</code>, <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">BLUETOOTH_CONNECT</code>, <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">NEARBY_WIFI_DEVICES</code>)
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Purpose:</strong> Used solely to power the local radar discovery feature. Bluetooth Low Energy (BLE) advertisements allow nearby peers to announce presence and detect other active Nearways nodes without internet access.</li>
                    <li><strong>Privacy Guarantee:</strong> Bluetooth identifiers are used solely for local device handshakes. No Bluetooth MAC addresses or hardware signatures are cataloged, tracked, or sent anywhere.</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900">
                    B. Location Access (<code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">ACCESS_FINE_LOCATION</code>, <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">ACCESS_COARSE_LOCATION</code>)
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Technical Context:</strong> On Android operating systems (particularly Android 9 through Android 12), the Android OS requires location permission to allow apps to perform Bluetooth Low Energy scans and Wi-Fi Direct network discovery, as nearby radio signals could theoretically be correlated to a location.</li>
                    <li><strong>Privacy Guarantee:</strong> <strong>Nearways does NOT collect, inspect, record, log, or transmit your physical GPS location.</strong> Location data is completely ignored by our application and is never accessed beyond fulfilling Android’s underlying hardware scanning requirement.</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900">
                    C. Wi-Fi State &amp; Networking (<code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">ACCESS_WIFI_STATE</code>, <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">CHANGE_WIFI_STATE</code>, <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">ACCESS_NETWORK_STATE</code>, <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">INTERNET</code>)
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Purpose:</strong> Enables creation of local Wi-Fi Direct peer groups, detection of local subnet IP addresses, and direct TCP/UDP socket communication between sender and receiver devices.</li>
                    <li><strong>Privacy Guarantee:</strong> Sockets are opened strictly on local non-routable subnets (e.g., <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">192.168.49.x</code> or local subnet IP ranges). Sockets communicate directly device-to-device with no external routing.</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900">
                    D. Camera Access (<code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">CAMERA</code>)
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Purpose:</strong> Used exclusively when opening the in-app "Scan QR Code" dialog to scan a peer's dynamic connection QR code for instant pairing.</li>
                    <li><strong>Privacy Guarantee:</strong> The camera feed is processed in real-time in device memory (RAM) solely by an offline QR barcode decoding algorithm. No photos, snapshots, or video streams are ever captured, saved to disk, or transmitted over any network.</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900">
                    E. Storage &amp; Media Access (<code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">READ_MEDIA_IMAGES</code>, <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">READ_MEDIA_VIDEO</code>, <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">READ_MEDIA_AUDIO</code>, <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">MANAGE_EXTERNAL_STORAGE</code>)
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Purpose:</strong> Allows you to browse and select your own files (documents, APKs, videos, photos) to share with a connected peer, and allows Nearways to write files you receive into your device's local storage (such as the standard <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">Downloads/Nearways</code> directory).</li>
                    <li><strong>Privacy Guarantee:</strong> Nearways only accesses files that you explicitly choose to send or receive. We never crawl, index, read, or upload your private photo libraries or documents.</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900">
                    F. Notifications (<code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">POST_NOTIFICATIONS</code>)
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Purpose:</strong> Displays foreground transfer progress bars, file completion alerts, and incoming connection requests while the app is active or in background transfer mode.</li>
                    <li><strong>Privacy Guarantee:</strong> Notifications are generated 100% locally by Android's <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">NotificationManager</code>. No remote push notification services (such as FCM) are used.</li>
                  </ul>
                </div>
              </div>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">4. Local Data Storage &amp; Control</h2>
              <p>
                All information generated within Nearways resides exclusively on your physical device:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>Local Profile:</strong> Your custom display name and avatar (if configured) are saved locally in the app's encrypted local SQLite Room database on your device.</li>
                <li><strong>Conversation History:</strong> Chat messages are stored locally on your device.</li>
                <li><strong>User Control:</strong> You retain full ownership and control over your data. You can delete individual chats, clear transfer records, or wipe all app data at any moment through Nearways Settings or Android System Settings (<code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">Settings &gt; Apps &gt; Nearways &gt; Clear Storage</code>).</li>
              </ul>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">5. Security &amp; Encryption</h2>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>Direct Socket Transport:</strong> File transfers and chat packets are sent over direct local TCP/UDP sockets between sender and receiver.</li>
                <li><strong>Connection Approval:</strong> Nearways provides interactive connection approval prompts and QR code cryptographic handshakes, ensuring you only receive files or chat messages from peers you explicitly approve.</li>
                <li><strong>No Third-Party Access:</strong> Because data does not travel across the public internet or through cloud relays, third-party interception, man-in-the-cloud attacks, or unauthorized data harvesting are prevented by design.</li>
              </ul>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">6. Children's Privacy (COPPA Compliance)</h2>
              <p>
                Nearways does not collect any personal information from any user, including children under the age of 13 (or under 16 in applicable jurisdictions). The application contains no advertising, no user behavioral profiling, and no in-app data harvesting. It is completely safe for general audiences.
              </p>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">7. Compliance with International Privacy Laws (GDPR &amp; CCPA/CPRA)</h2>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  <strong>GDPR (General Data Protection Regulation):</strong> Under GDPR, INOLAS operates under the principles of <strong>Data Minimization</strong> and <strong>Privacy by Design</strong>. Because no personal data is collected, processed, or transferred to third-party processors, user identity and privacy rights are inherently preserved.
                </li>
                <li>
                  <strong>CCPA / CPRA (California Consumer Privacy Act):</strong> We do not sell, share, or monetize personal information. We do not maintain personal user databases.
                </li>
              </ul>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">8. Changes to this Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in legal requirements or system features. Any updates will be included in newly compiled versions of the application and documented with an updated "Effective Date."
              </p>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">9. Contact Us</h2>
              <p>
                If you have questions, feedback, or concerns regarding this Privacy Policy or the security of Nearways, please contact us:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Entity:</strong> INOLAS</li>
                <li><strong>Email:</strong> <a href="mailto:azadtechnologies19@gmail.com" className="text-blue-600 hover:underline">azadtechnologies19@gmail.com</a></li>
                <li><strong>Developer Support:</strong> <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://github.com/</a></li>
              </ul>
            </section>
          </main>
        )}

        {/* ========================================================================= */}
        {/* TERMS OF SERVICE FOR NEARWAYS (Exact text provided by user)                */}
        {/* ========================================================================= */}
        {currentDoc === 'termsofservice' && (
          <main className="space-y-6 text-[15px] sm:text-base leading-relaxed text-[#374151]">
            <header className="space-y-2 pb-4 border-b border-gray-200">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Terms of Service for Nearways
              </h1>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p><strong>Effective Date:</strong> September 24, 2026</p>
                <p><strong>Publisher:</strong> INOLAS</p>
                <p><strong>Contact Email:</strong> <a href="mailto:azadtechnologies19@gmail.com" className="text-blue-600 hover:underline">azadtechnologies19@gmail.com</a></p>
                <p><strong>Application:</strong> Nearways: Offline Share &amp; Chat (Android)</p>
              </div>
            </header>

            <section className="space-y-3 pt-2">
              <h2 className="text-xl font-bold text-gray-900">1. Agreement to Terms</h2>
              <p>
                By downloading, installing, accessing, or using <strong>Nearways</strong> (the "Application"), provided by <strong>INOLAS</strong> ("we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not install or use the Application.
              </p>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">2. Description of the Service</h2>
              <p>
                Nearways is an offline, peer-to-peer (P2P) utility application engineered to facilitate high-speed local file sharing and decentralized communication between compatible Android devices using local Wi-Fi, Wi-Fi Direct, and Bluetooth protocols without requiring an active internet connection or third-party servers.
              </p>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">3. License Grant and Intellectual Property</h2>

              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">A. Limited License</h3>
                  <p className="mt-1">
                    INOLAS grants you a personal, revocable, non-exclusive, non-transferable, and royalty-free license to download, install, and use Nearways on your Android devices strictly in accordance with these Terms.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900">B. Ownership &amp; Intellectual Property</h3>
                  <p className="mt-1">
                    All rights, title, and interest in and to the Application—including software code, user interface designs, visual motifs, graphics, and the "From INOLAS" branding—are the exclusive intellectual property of INOLAS and are protected by applicable copyright, trademark, and intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900">C. Restrictions</h3>
                  <p className="mt-1">You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-1">
                    <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the binary releases of the Application, except to the extent permitted by applicable law.</li>
                    <li>Modify, adapt, translate, or create derivative works based upon the Application without prior written consent from INOLAS.</li>
                    <li>Remove, alter, or obscure any copyright, trademark, or proprietary rights notices displayed in or on the Application.</li>
                  </ul>
                </div>
              </div>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">4. User Conduct and Responsibilities</h2>
              <p>
                Nearways enables direct, decentralized, device-to-device transfers. Because no cloud intermediaries exist, you acknowledge and agree that:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Lawful Use Only:</strong> You must use the Application strictly in compliance with all applicable local, national, and international laws and regulations.
                </li>
                <li>
                  <strong>Content Responsibility:</strong> You are solely responsible for all content, files, media, and communications transmitted or received by your device using the Application.
                </li>
                <li>
                  <strong>Prohibited Content:</strong> You agree not to use the Application to distribute, share, or transmit:
                  <ul className="list-disc pl-6 space-y-1 mt-1">
                    <li>Malicious software, viruses, trojans, worms, spyware, or harmful executable code.</li>
                    <li>Content that infringes upon the intellectual property, copyright, patent, trademark, or privacy rights of any third party.</li>
                    <li>Unlawful, abusive, defamatory, threatening, obscene, or harmful materials.</li>
                  </ul>
                </li>
                <li>
                  <strong>Peer Connection Discretion:</strong> You have sole discretion over approving connection requests and pairing with nearby peers via radar discovery or QR code scanning. You are responsible for verifying the identity and trustworthiness of peers prior to accepting file transfers.
                </li>
              </ol>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">5. Privacy and Permissions</h2>
              <p>
                Your privacy is paramount. Nearways operates with a Zero-Cloud architecture and does not collect, sell, or store your personal data. The Application requests specific hardware permissions (such as Bluetooth, Wi-Fi, and Camera for QR code scanning) strictly to perform local peer discovery and file transfer. For full details on our data protection practices, please consult our <strong>Privacy Policy</strong>.
              </p>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">6. Disclaimer of Warranties</h2>
              <p className="font-semibold text-gray-800">
                THE APPLICATION IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
              </p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, INOLAS EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</li>
                <li>WARRANTIES THAT THE APPLICATION WILL MEET YOUR SPECIFIC REQUIREMENTS OR THAT OPERATION WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.</li>
                <li>WARRANTIES REGARDING THE SPEED, RANGE, OR RELIABILITY OF WIRELESS SIGNALS (BLUETOOTH, WI-FI DIRECT), WHICH ARE SUBJECT TO PHYSICAL DEVICE HARDWARE AND ENVIRONMENTAL INTERFERENCE.</li>
              </ul>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">7. Limitation of Liability</h2>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL INOLAS, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES WHATSOEVER (INCLUDING LOSS OF DATA, DEVICE CORRUPTION, LOSS OF REVENUE, BUSINESS INTERRUPTION, OR HARDWARE MALFUNCTION) ARISING OUT OF OR IN CONNECTION WITH YOUR USE OR INABILITY TO USE THE APPLICATION, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p>
                YOUR SOLE REMEDY FOR DISSATISFACTION WITH THE APPLICATION IS TO DISCONTINUE USE AND UNINSTALL THE APPLICATION FROM YOUR DEVICE.
              </p>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">8. Termination</h2>
              <p>
                You may terminate these Terms at any time by deleting and uninstalling Nearways from all your devices. INOLAS reserves the right to terminate or suspend your license to use the Application at any time without notice if you breach any provision of these Terms.
              </p>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">9. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws applicable to software services, without giving effect to any principles of conflicts of law.
              </p>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">10. Modifications to Terms</h2>
              <p>
                We reserve the right to revise or modify these Terms at our discretion. Any updated version will be packaged with new releases of the Application. Your continued use of the Application after revisions become effective constitutes your acceptance of the updated Terms.
              </p>
            </section>

            <hr className="border-gray-200 my-6" />

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">11. Contact Information</h2>
              <p>
                If you have any questions or inquiries regarding these Terms of Service, please contact:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Entity:</strong> INOLAS</li>
                <li><strong>Email:</strong> <a href="mailto:azadtechnologies19@gmail.com" className="text-blue-600 hover:underline">azadtechnologies19@gmail.com</a></li>
              </ul>
            </section>
          </main>
        )}
      </div>
    </div>
  );
};
