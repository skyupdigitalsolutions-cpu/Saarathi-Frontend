import { useEffect, useState } from "react";
import { Palette, Cpu, Plug, Webhook } from "lucide-react";
import { api } from "../lib/api.js";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head">
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon size={17} color="var(--brand)" />
          <div className="card-title">{title}</div>
        </div>
      </div>
      <div className="card-pad">{children}</div>
    </div>
  );
}

const Code = ({ children }) => (
  <code style={{ background: "var(--line-2)", padding: "2px 7px", borderRadius: 6, fontSize: 12.5 }}>{children}</code>
);

export default function Settings() {
  const [channels, setChannels] = useState({});
  useEffect(() => { api.channels().then((d) => setChannels(d.channels)).catch(() => {}); }, []);

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <Section icon={Plug} title="Channels">
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 14 }}>
          Channels are controlled by flags in the backend <b>.env</b>. Set to <Code>true</Code> and restart to activate.
        </p>
        <dl className="kv">
          <dt>WhatsApp</dt><dd><Code>CHANNEL_WHATSAPP</Code> · {channels.whatsapp ? "live" : "locked"}</dd>
          <dt>SMS</dt><dd><Code>CHANNEL_SMS</Code> · {channels.sms ? "live" : "locked"}</dd>
          <dt>Email</dt><dd><Code>CHANNEL_EMAIL</Code> · {channels.email ? "live" : "locked"}</dd>
        </dl>
      </Section>

      <Section icon={Cpu} title="AI models">
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 14 }}>
          Set your key + models in <b>.env</b>. Classification runs on every new lead; the copilot uses a stronger model.
        </p>
        <dl className="kv">
          <dt>API key</dt><dd><Code>OPENAI_API_KEY</Code></dd>
          <dt>Classifier</dt><dd><Code>CLASSIFIER_MODEL</Code> · gpt-4o-mini</dd>
          <dt>Copilot</dt><dd><Code>COPILOT_MODEL</Code> · gpt-4o</dd>
        </dl>
      </Section>

      <Section icon={Webhook} title="Meta lead intake">
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 12 }}>
          Point your Meta Lead Ads webhook here. Verify token must match <Code>META_VERIFY_TOKEN</Code>.
        </p>
        <dl className="kv">
          <dt>Callback URL</dt><dd><Code>https://your-domain/api/intake/meta</Code></dd>
          <dt>Test endpoint</dt><dd><Code>POST /api/intake/test</Code></dd>
        </dl>
      </Section>

      <Section icon={Palette} title="Branding">
        <p className="muted" style={{ fontSize: 13.5 }}>
          Colors live as CSS variables in <Code>src/theme.css</Code>. Change <Code>--brand</Code>, <Code>--brand-deep</Code>, and <Code>--accent</Code> to rebrand the whole app.
        </p>
      </Section>
    </div>
  );
}
