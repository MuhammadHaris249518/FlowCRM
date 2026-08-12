import { createApp } from "./app";
import { startOutboxPoller } from "./modules/automation/automation.outbox-poller";
import { startResumePoller } from "./modules/automation/automation.resume-poller";
import { startAiPoller } from "./modules/automation/automation.ai-poller";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`FlowCRM API listening on port ${PORT}`);
  startOutboxPoller();
  startResumePoller();
  startAiPoller();
});

