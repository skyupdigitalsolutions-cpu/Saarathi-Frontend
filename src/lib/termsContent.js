// src/lib/termsContent.js
// Single source of truth for T&C content.
// Imported by TermsGate (blocking gate) and Sidebar (viewer modal).

export const TERMS_INTRO =
  "These Terms and Conditions govern your use of the Saarathi CRM software operated by Skyup Digital Solutions on behalf of Sarathi Associates. By continuing to use this software you agree to comply with and be bound by the following terms. Effective date: 20 July 2026.";

export const TERMS_SECTIONS = [
  { heading: "1. Customer Data Accuracy", body: "The Customer is solely responsible for maintaining accurate customer, lead, employee and business information entered into the CRM." },
  { heading: "2. Lead Management", body: "Lead information, lead status, assignments and follow-up activities are maintained by the Customer and should be regularly verified." },
  { heading: "3. Sales Pipeline", body: "Pipeline stages, sales progress and opportunity records depend entirely on user-entered information." },
  { heading: "4. Campaign Management", body: "Campaign information, marketing activities and campaign reports should be independently verified before business use." },
  { heading: "5. Customer Communication", body: "Customers are responsible for all emails, WhatsApp messages, SMS and other communications sent through the CRM." },
  { heading: "6. WhatsApp Integration", body: "WhatsApp services are governed by Meta policies and Customers are responsible for complying with all applicable platform requirements." },
  { heading: "7. Third-Party Integrations", body: "Features integrated with Google, Meta, WhatsApp or other third-party services are subject to the availability and terms of those providers." },
  { heading: "8. AI Assistance", body: "AI-generated summaries, recommendations and responses should be independently reviewed before making business decisions." },
  { heading: "9. Reports & Analytics", body: "Reports and dashboards are generated from user-entered and synchronised data and should be independently verified." },
  { heading: "10. User Account Responsibility", body: "Organisations are responsible for assigning appropriate user roles and all activities performed through authorised accounts." },
  { heading: "11. Data Import", body: "Imported customer, lead and business data should be verified before use." },
  { heading: "12. Data Export", body: "Exported files become the Customer's responsibility after download." },
  { heading: "13. Document Management", body: "Customers are responsible for verifying quotations, documents and attachments before sharing." },
  { heading: "14. Notification Services", body: "Email, WhatsApp and other notifications depend on third-party services and internet availability." },
  { heading: "15. Task & Follow-up Management", body: "Customers are responsible for reviewing follow-up schedules, reminders and assigned tasks." },
  { heading: "16. Subscription Responsibility", body: "Access to the software depends on an active subscription and compliance with applicable licensing terms." },
  { heading: "17. Data Security", body: "Customers must safeguard user credentials, passwords, API keys and other authentication information." },
  { heading: "18. Confidential Information", body: "Customers are responsible for protecting confidential business information stored within the CRM." },
  { heading: "19. Software Updates", body: "SkyUp may release software updates, security patches and feature enhancements without prior notice." },
  { heading: "20. Software Availability", body: "Temporary downtime due to maintenance, cloud infrastructure or third-party services shall not constitute a breach of service." },
  { heading: "21. Data Backup", body: "Customers should maintain independent backups of important business information." },
  { heading: "22. Business Compliance", body: "Customers remain responsible for complying with all applicable business, privacy and communication laws." },
  { heading: "23. Fraud Prevention", body: "Customers must take reasonable measures to prevent unauthorised access and fraudulent use of their accounts." },
  { heading: "24. Intellectual Property", body: "All software, source code, trademarks, documentation and related intellectual property remain the exclusive property of SkyUp." },
  { heading: "25. Acceptable Use", body: "Customers shall not use the software for unlawful, abusive, fraudulent or unauthorised activities." },
  { heading: "26. Limitation of Liability", body: "SkyUp is not liable for business losses, loss of data, loss of customers, missed opportunities or damages resulting from user actions or third-party service failures." },
  { heading: "27. Force Majeure", body: "SkyUp shall not be responsible for service interruptions caused by events beyond its reasonable control." },
  { heading: "28. Suspension of Service", body: "SkyUp reserves the right to suspend access for violations of these Terms and Conditions or applicable laws." },
  { heading: "29. Changes to Terms", body: "SkyUp may revise these Terms and Conditions from time to time and continued use of the software constitutes acceptance of the updated version." },
  { heading: "30. Acceptance of CRM Records", body: "Records, reports, communications and documents generated through the software are deemed approved once created, downloaded, shared or transmitted by the Customer." },
];

export const TERMS_DECLARATION =
  "I have read, understood, and agree to the Terms and Conditions of Saarathi CRM.";
