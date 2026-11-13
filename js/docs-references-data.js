/* Docs References manifest.
 * Source: Penjelajah-CyberSecurity/References/ (raw GitHub).
 * src = EN source (default). ?lang=... swaps suffix (-en -> -id, dll); id/src key stays. */
(function () {
  var RAW =
    'https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/References/';
  window.REFERENCE_MODULES = [
    { id: 'index', title: 'Overview', group: 'Start', src: RAW + 'index-en.md' },

    /* iMoon07 docs: source-code documentation mirrored from the site repo and
       the logo library. Grouped under Start so they sit right below Overview. */
    { id: 'imoon-topology', title: 'Topology Diagrams', group: 'Start', src: RAW + 'imoon-topology-en.md' },
    { id: 'imoon-alur-draw', title: 'Alur Visual Engine & draw.html', group: 'Start', src: RAW + 'imoon-alur-draw-en.md' },
    { id: 'imoon-ai-tools', title: 'ai-tools Pipeline', group: 'Start', src: RAW + 'imoon-ai-tools-en.md' },
    { id: 'imoon-logo-svg', title: 'Logo & Icon Library', group: 'Start', src: RAW + 'imoon-logo-svg-en.md' },

    { id: 'standards', title: 'Standards & Core Protocols', group: 'Core', src: RAW + 'standards-en.md' },

    { id: 'languages-scripting', title: 'Languages & Scripting', group: 'Dev', src: RAW + 'languages-scripting-en.md' },

    { id: 'low-level-systems', title: 'Low-Level, Systems & Toolchain', group: 'Core', src: RAW + 'low-level-systems-en.md' },

    { id: 'web-api-frameworks', title: 'Web, API & Frameworks', group: 'Dev', src: RAW + 'web-api-frameworks-en.md' },
    { id: 'data-messaging', title: 'Data, Databases & Messaging', group: 'Dev', src: RAW + 'data-messaging-en.md' },

    { id: 'windows-endpoint', title: 'Windows, Identity & Endpoint', group: 'Infra', src: RAW + 'windows-endpoint-en.md' },
    { id: 'linux-server', title: 'Linux, OS & Server', group: 'Infra', src: RAW + 'linux-server-en.md' },

    { id: 'network-protocols', title: 'Networking & Protocols', group: 'Core', src: RAW + 'network-protocols-en.md' },

    { id: 'virtualization-containers', title: 'Virtualization, Containers & K8s', group: 'Infra', src: RAW + 'virtualization-containers-en.md' },
    { id: 'cloud-iac', title: 'Cloud & Infrastructure as Code', group: 'Infra', src: RAW + 'cloud-iac-en.md' },
    { id: 'cicd-dev-workflow', title: 'CI/CD, Git & Workflow', group: 'Infra', src: RAW + 'cicd-dev-workflow-en.md' },
    { id: 'observability-ops', title: 'Observability & Operations', group: 'Infra', src: RAW + 'observability-ops-en.md' },

    { id: 'security-detection', title: 'WAF, IDS/IPS, SIEM, SOAR', group: 'Security', src: RAW + 'security-detection-en.md' },
    { id: 'security-appsec-identity', title: 'IT, AppSec & Identity', group: 'Security', src: RAW + 'security-appsec-identity-en.md' },
    { id: 'security-ot-ics', title: 'OT / ICS / IoT & Industrial', group: 'Security', src: RAW + 'security-ot-ics-en.md' },
    { id: 'security-banking-finance', title: 'Banking / Finance / Payments', group: 'Security', src: RAW + 'security-banking-finance-en.md' },
    { id: 'security-hardening', title: 'Hardening & Secure Config', group: 'Security', src: RAW + 'security-hardening-en.md' },

    { id: 'testing-quality', title: 'Testing & Quality', group: 'Dev', src: RAW + 'testing-quality-en.md' },
    { id: 'architecture-engineering', title: 'Architecture & Engineering', group: 'Dev', src: RAW + 'architecture-engineering-en.md' },

    { id: 'hardware-firmware-architecture', title: 'Hardware, Firmware & Computer Architecture', group: 'Core', src: RAW + 'hardware-firmware-architecture-en.md' },

    { id: 'server-bmc-platform-security', title: 'Server Management, BMC & Platform Security', group: 'Security', src: RAW + 'server-bmc-platform-security-en.md' },

    { id: 'storage-filesystems-integrity', title: 'Storage, Filesystems & Data Integrity', group: 'Infra', src: RAW + 'storage-filesystems-integrity-en.md' },
    { id: 'distributed-systems-consensus', title: 'Distributed Systems & Consensus', group: 'Infra', src: RAW + 'distributed-systems-consensus-en.md' },
    { id: 'embedded-rtos', title: 'Embedded Systems & Real-Time Operating Systems', group: 'Infra', src: RAW + 'embedded-rtos-en.md' },

    { id: 'graphics-gpu-compute', title: 'Graphics, GPU & Compute', group: 'Core', src: RAW + 'graphics-gpu-compute-en.md' },

    { id: 'network-automation-programmable', title: 'Network Automation & Programmable Networking', group: 'Infra', src: RAW + 'network-automation-programmable-en.md' },
    { id: 'backup-recovery-business-continuity', title: 'Backup, Recovery & Business Continuity', group: 'Infra', src: RAW + 'backup-recovery-business-continuity-en.md' },

    { id: 'ai-ml-mlops', title: 'Artificial Intelligence, Machine Learning & MLOps', group: 'Dev', src: RAW + 'ai-ml-mlops-en.md' },

    { id: 'formal-methods-verification', title: 'Formal Methods, Verification & Software Reliability', group: 'Core', src: RAW + 'formal-methods-verification-en.md' },

    { id: 'pki-certificate-internet-trust', title: 'PKI, Certificate Management & Internet Trust', group: 'Security', src: RAW + 'pki-certificate-internet-trust-en.md' },
    { id: 'privacy-engineering-data-governance', title: 'Privacy Engineering & Data Governance', group: 'Security', src: RAW + 'privacy-engineering-data-governance-en.md' },

    { id: 'automotive-aerospace-safety', title: 'Automotive, Aerospace & Safety-Critical Systems', group: 'Industry', src: RAW + 'automotive-aerospace-safety-en.md' },

    { id: 'compilers-runtimes-pl-theory', title: 'Compilers, Runtimes & Programming Language Theory', group: 'Core', src: RAW + 'compilers-runtimes-pl-theory-en.md' },

    { id: 'hardware-security-trusted-execution', title: 'Hardware Security & Trusted Execution', group: 'Security', src: RAW + 'hardware-security-trusted-execution-en.md' },

    { id: 'digital-logic-fpga-hdl', title: 'Digital Logic, FPGA & HDL', group: 'Core', src: RAW + 'digital-logic-fpga-hdl-en.md' },
    { id: 'scientific-computing-numerical-methods-hpc', title: 'Scientific Computing, Numerical Methods & HPC', group: 'Core', src: RAW + 'scientific-computing-numerical-methods-hpc-en.md' },

    { id: 'internet-infrastructure-domain-operations', title: 'Internet Infrastructure & Domain Operations', group: 'Infra', src: RAW + 'internet-infrastructure-domain-operations-en.md' },
    { id: 'email-infrastructure-messaging-protocols', title: 'Email Infrastructure & Messaging Protocols', group: 'Infra', src: RAW + 'email-infrastructure-messaging-protocols-en.md' },

    { id: 'geospatial-gis-remote-sensing', title: 'Geospatial, GIS & Remote Sensing', group: 'Dev', src: RAW + 'geospatial-gis-remote-sensing-en.md' },
    { id: 'multimedia-audio-video-streaming', title: 'Multimedia, Audio, Video & Streaming', group: 'Dev', src: RAW + 'multimedia-audio-video-streaming-en.md' },
    { id: 'accessibility-i18n-l10n', title: 'Accessibility, Internationalization & Localization', group: 'Dev', src: RAW + 'accessibility-i18n-l10n-en.md' },
    { id: 'data-serialization-interoperability', title: 'Data Serialization & Interoperability', group: 'Dev', src: RAW + 'data-serialization-interoperability-en.md' },
    { id: 'data-engineering-data-lakes-analytics', title: 'Data Engineering, Data Lakes & Analytics', group: 'Dev', src: RAW + 'data-engineering-data-lakes-analytics-en.md' },

    { id: 'software-supply-chain-security', title: 'Software Supply Chain Security', group: 'Security', src: RAW + 'software-supply-chain-security-en.md' },
    { id: 'digital-forensics-incident-response', title: 'Digital Forensics & Incident Response (DFIR)', group: 'Security', src: RAW + 'digital-forensics-incident-response-en.md' },
    { id: 'identity-authentication-federation', title: 'Identity, Authentication & Federation', group: 'Security', src: RAW + 'identity-authentication-federation-en.md' },
    { id: 'cryptography-key-management', title: 'Cryptography & Key Management', group: 'Security', src: RAW + 'cryptography-key-management-en.md' },

    { id: 'enterprise-architecture-governance', title: 'Enterprise Architecture & Governance', group: 'Dev', src: RAW + 'enterprise-architecture-governance-en.md' },

    { id: 'time-synchronization-clock-infrastructure', title: 'Time Synchronization & Clock Infrastructure', group: 'Infra', src: RAW + 'time-synchronization-clock-infrastructure-en.md' },

    { id: 'indonesia-regulations-cybersecurity', title: 'Indonesian Regulations & National Cybersecurity', group: 'Security', src: RAW + 'indonesia-regulations-cybersecurity-en.md' },

    { id: 'telecommunications-mobile-networks', title: 'Telecommunications & Mobile Networks', group: 'Industry', src: RAW + 'telecommunications-mobile-networks-en.md' },
    { id: 'satellite-space-aerospace', title: 'Satellite, Space Systems & Aerospace Computing', group: 'Industry', src: RAW + 'satellite-space-aerospace-en.md' },
    { id: 'quantum-computing-quantum-information', title: 'Quantum Computing & Quantum Information', group: 'Industry', src: RAW + 'quantum-computing-quantum-information-en.md' },
    { id: 'energy-smart-grid', title: 'Energy Systems, Smart Grid & Power Infrastructure', group: 'Industry', src: RAW + 'energy-smart-grid-en.md' },
    { id: 'railway-transportation', title: 'Railway Systems & Transportation Technology', group: 'Industry', src: RAW + 'railway-transportation-en.md' },
    { id: 'maritime-navigation', title: 'Maritime Systems & Navigation Technology', group: 'Industry', src: RAW + 'maritime-navigation-en.md' },
    { id: 'medical-devices-health-technology', title: 'Medical Devices & Health Technology', group: 'Industry', src: RAW + 'medical-devices-health-technology-en.md' },
    { id: 'computational-biology-bioinformatics', title: 'Computational Biology & Bioinformatics', group: 'Industry', src: RAW + 'computational-biology-bioinformatics-en.md' },
    { id: 'digital-manufacturing', title: 'Digital Manufacturing & Industrial Engineering', group: 'Industry', src: RAW + 'digital-manufacturing-en.md' },
    { id: 'computational-fluid-dynamics-engineering-simulation', title: 'Computational Fluid Dynamics & Engineering Simulation', group: 'Industry', src: RAW + 'computational-fluid-dynamics-engineering-simulation-en.md' },

    { id: 'mobile-embedded-security-forensics', title: 'Mobile & Embedded Platform Security/Forensics', group: 'Security', src: RAW + 'mobile-embedded-security-forensics-en.md' },

    { id: 'os-research-kernel-internals', title: 'Operating Systems Research & Kernel Internals', group: 'Core', src: RAW + 'os-research-kernel-internals-en.md' },

    { id: 'storage-protocols-memory-technologies', title: 'Storage Protocols & Memory Technologies', group: 'Infra', src: RAW + 'storage-protocols-memory-technologies-en.md' },

    { id: 'computer-architecture-microarchitecture', title: 'Computer Architecture & Microarchitecture', group: 'Core', src: RAW + 'computer-architecture-microarchitecture-en.md' },

    { id: 'software-testing-quality-engineering', title: 'Software Testing & Quality Engineering', group: 'Dev', src: RAW + 'software-testing-quality-engineering-en.md' },

    { id: 'reverse-engineering-binary-analysis', title: 'Reverse Engineering & Binary Analysis', group: 'Security', src: RAW + 'reverse-engineering-binary-analysis-en.md' },

    { id: 'api-governance-enterprise-integration', title: 'API Governance & Enterprise Integration', group: 'Dev', src: RAW + 'api-governance-enterprise-integration-en.md' },

    { id: 'threat-intelligence-vulnerability-research', title: 'Threat Intelligence & Vulnerability Research', group: 'Security', src: RAW + 'threat-intelligence-vulnerability-research-en.md' },
    { id: 'penetration-testing-offensive-security', title: 'Penetration Testing & Offensive Security', group: 'Security', src: RAW + 'penetration-testing-offensive-security-en.md' },
    { id: 'adversary-simulation-detection-engineering', title: 'Adversary Simulation & Detection Engineering', group: 'Security', src: RAW + 'adversary-simulation-detection-engineering-en.md' },
    { id: 'soc-siem-security-operations', title: 'SOC, SIEM & Security Operations', group: 'Security', src: RAW + 'soc-siem-security-operations-en.md' },
    { id: 'network-security-traffic-analysis', title: 'Network Security & Traffic Analysis', group: 'Security', src: RAW + 'network-security-traffic-analysis-en.md' },
    { id: 'cloud-container-security', title: 'Cloud & Container Security', group: 'Security', src: RAW + 'cloud-container-security-en.md' },
    { id: 'ot-ics-industrial-cybersecurity', title: 'OT/ICS & Industrial Cybersecurity', group: 'Security', src: RAW + 'ot-ics-industrial-cybersecurity-en.md' },

    { id: 'tourism-hospitality-travel', title: 'Tourism, Hospitality & Travel Technology', group: 'Industry', src: RAW + 'tourism-hospitality-travel-en.md' },
    { id: 'business-industry-public-infra', title: 'Business, Industry & Public Infrastructure', group: 'Industry', src: RAW + 'business-industry-public-infra-en.md' },

    { id: 'research-knowledge-open-science', title: 'Research, Knowledge & Open Science', group: 'Research', src: RAW + 'research-knowledge-open-science-en.md' },
  ];
})();
