/* Docs References manifest.
 * Source: Penjelajah-CyberSecurity/References/ (raw GitHub).
 * src = EN source (default). ?lang=... swaps suffix (-en -> -id, dll); id/src key stays. */
(function () {
  var RAW =
    'https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/References/';
  window.REFERENCE_MODULES = [
    { id: 'index',                     title: 'Overview',                        group: 'Start',    src: RAW + 'index-en.md' },
    { id: 'standards',                 title: 'Standards & Core Protocols',       group: 'Core',     src: RAW + 'standards-en.md' },
    { id: 'low-level-systems',         title: 'Low-Level, Systems & Toolchain',   group: 'Core',     src: RAW + 'low-level-systems-en.md' },
    { id: 'network-protocols',         title: 'Networking & Protocols',           group: 'Core',     src: RAW + 'network-protocols-en.md' },
    { id: 'languages-scripting',       title: 'Languages & Scripting',            group: 'Dev',      src: RAW + 'languages-scripting-en.md' },
    { id: 'web-api-frameworks',        title: 'Web, API & Frameworks',            group: 'Dev',      src: RAW + 'web-api-frameworks-en.md' },
    { id: 'data-messaging',            title: 'Data, Databases & Messaging',      group: 'Dev',      src: RAW + 'data-messaging-en.md' },
    { id: 'testing-quality',           title: 'Testing & Quality',                group: 'Dev',      src: RAW + 'testing-quality-en.md' },
    { id: 'architecture-engineering',  title: 'Architecture & Engineering',       group: 'Dev',      src: RAW + 'architecture-engineering-en.md' },
    { id: 'windows-endpoint',          title: 'Windows, Identity & Endpoint',     group: 'Infra',    src: RAW + 'windows-endpoint-en.md' },
    { id: 'linux-server',              title: 'Linux, OS & Server',               group: 'Infra',    src: RAW + 'linux-server-en.md' },
    { id: 'virtualization-containers', title: 'Virtualization, Containers & K8s', group: 'Infra',    src: RAW + 'virtualization-containers-en.md' },
    { id: 'cloud-iac',                 title: 'Cloud & Infrastructure as Code',   group: 'Infra',    src: RAW + 'cloud-iac-en.md' },
    { id: 'cicd-dev-workflow',         title: 'CI/CD, Git & Workflow',            group: 'Infra',    src: RAW + 'cicd-dev-workflow-en.md' },
    { id: 'observability-ops',         title: 'Observability & Operations',       group: 'Infra',    src: RAW + 'observability-ops-en.md' },
    { id: 'security-detection',        title: 'WAF, IDS/IPS, SIEM, SOAR',         group: 'Security', src: RAW + 'security-detection-en.md' },
    { id: 'security-appsec-identity',  title: 'IT, AppSec & Identity',            group: 'Security', src: RAW + 'security-appsec-identity-en.md' },
    { id: 'security-ot-ics',           title: 'OT / ICS / IoT & Industrial',      group: 'Security', src: RAW + 'security-ot-ics-en.md' },
    { id: 'security-banking-finance',  title: 'Banking / Finance / Payments',     group: 'Security', src: RAW + 'security-banking-finance-en.md' },
    { id: 'security-hardening',        title: 'Hardening & Secure Config',        group: 'Security', src: RAW + 'security-hardening-en.md' },
  ];
})();
