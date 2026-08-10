import { expect, test } from "@playwright/test";
import { getWorkflowFixture } from "../src/lib/workflow-domain";

test("demo video is available from the landing page only",async({page})=>{
  await page.goto("/");
  const watchDemo=page.getByRole("button",{name:"Watch demo"});
  await watchDemo.click();
  const dialog=page.getByRole("dialog",{name:"See Mission Control in operation"});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("demo-video")).toHaveAttribute("src","/mission-control-demo.mp4");
  await page.getByRole("button",{name:"Close demo video"}).click();
  await page.getByRole("link",{name:/Run the live prototype/}).click();
  await expect(page).toHaveURL(/\/studio/);
  await expect(page.getByRole("dialog",{name:"See Mission Control in operation"})).toHaveCount(0);
});

test("landing page and primary navigation", async ({ page }) => {
  const errors:string[]=[]; page.on("console",m=>{if(m.type()==="error")errors.push(m.text())});
  await page.goto("/");
  await expect(page.getByRole("heading", { name:/Operate AI workflows/ })).toBeVisible();
  await page.getByRole("link", { name:"Read the product case study" }).first().click();
  await expect(page).toHaveURL(/case-study/);
  await expect(page.getByRole("heading", { name:/From one AI recommendation/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("retention workflow screens a population and explains each at-risk member", async ({ page }) => {
  await page.route("**/api/workflow-runs", route => route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify(getWorkflowFixture("membership-retention")) }));
  await page.goto("/studio");
  await page.getByRole("button", { name:/Membership Retention/ }).first().click();
  await expect(page.getByText("Screen the complete membership retention population")).toBeVisible();
  await expect(page.getByLabel("Select synthetic test member")).toHaveCount(0);
  await expect(page.getByText("Model strategy")).toHaveCount(0);
  await page.getByTestId("run-workflow").click();
  await expect(page.getByTestId("processing-stage")).toBeVisible();
  await expect(page.getByText("What is happening in this stage")).toBeVisible();
  await expect(page.getByText("Waiting for the prior operation").first()).toBeVisible();
  await expect(page.getByTestId("workflow-run-complete")).toContainText("12 members screened", { timeout:15_000 });
  await page.locator('[data-stage-id="member-data"]').click();
  await expect(page.getByTestId("source-stage-detail")).toContainText("No score, recommendation, or action is produced here");
  await page.locator('[data-stage-id="risk-score"]').click();
  await expect(page.getByText("Sarah Chen", { exact:true }).first()).toBeVisible();
  await expect(page.getByText("Owen Brooks", { exact:true }).first()).toBeVisible();
  await expect(page.getByTestId("analysis-stage-detail")).toContainText("Evaluated score");
  await page.locator('[data-stage-id="context"]').click();
  await expect(page.getByTestId("context-stage-detail")).toContainText("Evidence package");
  await page.locator('[data-stage-id="recommendation"]').click();
  await expect(page.getByText("What the workflow found")).toBeVisible();
  await page.locator('[data-stage-id="policy"]').click();
  await expect(page.getByTestId("policy-stage-detail")).toContainText("Authorization outcome");
  await expect(page.getByTestId("policy-stage-detail")).toContainText("rules execute outside Claude");
});

test("human review shows the draft and released outreach history", async ({ page }) => {
  await page.route("**/api/workflow-runs", route => route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify(getWorkflowFixture("membership-retention")) }));
  await page.goto("/studio");
  await page.getByRole("button", { name:/Membership Retention/ }).first().click();
  await page.getByTestId("run-workflow").click();
  await expect(page.getByTestId("workflow-run-complete")).toContainText("12 members screened", { timeout:15_000 });
  await page.getByRole("button", { name:/Human review/ }).last().click();
  await expect(page.getByText("Recipient-facing message · editable")).toBeVisible();
  const message=page.locator("textarea");
  await expect(message).toHaveValue(/We can also offer you 25% off/);
  await expect(message).not.toHaveValue(/Invite Sarah/);
  const recipientCopy=await message.inputValue();
  await message.fill("Invite Sarah to the leadership program with a 25% renewal incentive.");
  await expect(page.getByText(/Remove internal workflow language before release/)).toBeVisible();
  await expect(page.getByTestId("approve-candidate")).toBeDisabled();
  await message.fill(recipientCopy);
  await expect(page.locator('input[value="sarah.chen@example.org"]')).toBeVisible();
  await page.getByTestId("approve-candidate").click();
  await expect(page.getByText(/Sending outreach for Sarah Chen/)).toBeVisible();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name:/Outreach/ }).last().click();
  await expect(page.getByText("Sent (simulated)").first()).toBeVisible();
  await expect(page.getByText("Exact released message")).toHaveCount(0);
  await page.getByRole("button", { name:/Sarah Chen/ }).last().click();
  await expect(page.getByText("Exact released message")).toBeVisible();
});

test("demo data persists when the user visits the product site and returns", async ({ page, isMobile }) => {
  await page.route("**/api/workflow-runs", route => route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify(getWorkflowFixture("membership-retention")) }));
  await page.goto("/studio");
  await page.getByRole("button", { name:/Membership Retention/ }).first().click();
  await page.getByTestId("run-workflow").click();
  await expect(page.getByTestId("workflow-run-complete")).toContainText("12 members screened", { timeout:15_000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name:/Operate AI workflows/ })).toBeVisible();
  await page.goto("/studio");
  await expect(page.getByTestId("workflow-run-complete")).toContainText("12 members screened");
  if(isMobile)await page.getByRole("button",{name:"Open navigation"}).click();
  await page.getByRole("button",{name:"Overview",exact:true}).click();
  await expect(page.getByText("12",{exact:true}).first()).toBeVisible();
  await expect(page.getByText("Run complete",{exact:true})).toBeVisible();
});

test("each workflow has a domain-specific population and full review path", async ({ page }) => {
  await page.route("**/api/workflow-runs", async route => { const body=route.request().postDataJSON(); await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(getWorkflowFixture(body.workflowId))}); });
  await page.goto("/studio");
  await page.getByRole("button", { name:/Membership Retention/ }).first().click();
  await page.getByLabel("Select workflow").selectOption("community-moderation");
  await page.getByTestId("run-workflow").click();
  await expect(page.getByTestId("workflow-run-complete")).toContainText("10 posts screened", { timeout:15_000 });
  await page.locator('[data-stage-id="classification"]').click();
  await expect(page.getByText("VendorBoost", { exact:true }).first()).toBeVisible();
  await page.getByLabel("Select workflow").selectOption("event-growth");
  await page.getByTestId("run-workflow").click();
  await expect(page.getByTestId("workflow-run-complete")).toContainText("6 events screened", { timeout:15_000 });
  await page.locator('[data-stage-id="signals"]').click();
  await expect(page.getByText("Leadership Summit", { exact:true }).first()).toBeVisible();
});

test("overview is derived from this session instead of invented KPIs", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("Records screened")).toBeVisible();
  await expect(page.getByText("Revenue protected")).toHaveCount(0);
  await expect(page.getByText("Staff hours saved")).toHaveCount(0);
  await expect(page.getByText("Not run", { exact:true }).first()).toBeVisible();
});

test("governance publishes a real session policy version", async ({ page, isMobile }) => {
  await page.goto("/studio");
  if (isMobile) await page.getByRole("button", { name:"Open navigation" }).click();
  await page.getByRole("button", { name:"Governance" }).click();
  await expect(page.getByRole("heading", { name:"Define authority outside the model." })).toBeVisible();
  await page.getByLabel("Minimum confidence for grouped approval").fill("90");
  await expect(page.getByText("Draft changes not published")).toBeVisible();
  await page.getByTestId("publish-policy").click();
  await expect(page.getByText(/Policy v3.3 published/)).toBeVisible();
});

test("global review inbox starts honestly empty", async ({ page }) => {
  await page.goto("/studio#review");
  await expect(page.getByRole("heading", { name:"Decisions that need judgment." })).toBeVisible();
  await expect(page.getByText("No decisions are waiting")).toBeVisible();
});

test("reset demo clears runs, decisions, actions, and governance changes", async ({ page, isMobile }) => {
  const navigate=async(name:string)=>{
    if(isMobile)await page.getByRole("button",{name:"Open navigation"}).click();
    await page.getByRole("button",{name,exact:true}).click();
  };
  await page.route("**/api/workflow-runs", route => route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify(getWorkflowFixture("membership-retention")) }));
  await page.goto("/studio");
  await navigate("Workflows");
  await page.getByTestId("run-workflow").click();
  await expect(page.getByTestId("workflow-run-complete")).toContainText("12 members screened",{timeout:15_000});
  await page.getByTestId("approve-candidate").click();
  await page.waitForTimeout(800);
  await navigate("Governance");
  await page.getByLabel("Minimum confidence for grouped approval").fill("90");
  await page.getByTestId("publish-policy").click();
  await navigate("Reset demo");
  await expect(page.getByRole("heading",{name:"Return the workspace to its starting state."})).toBeVisible();
  await expect(page.getByText("1 run",{exact:true})).toBeVisible();
  await expect(page.getByText("1 action",{exact:true})).toBeVisible();
  await expect(page.getByText("v3.3",{exact:true})).toBeVisible();
  await page.getByTestId("begin-reset-demo").click();
  await expect(page.getByTestId("reset-confirmation")).toBeVisible();
  await page.getByTestId("confirm-reset-demo").click();
  await expect(page.getByRole("heading",{name:"Your operating session is ready."})).toBeVisible();
  await expect(page.getByText("0 / 3",{exact:true})).toBeVisible();
  await expect(page.getByText("Nothing has been released")).toBeVisible();
  await navigate("Governance");
  await expect(page.getByText("v3.2",{exact:true}).first()).toBeVisible();
  await expect(page.getByLabel("Minimum confidence for grouped approval")).toHaveValue("95");
  await page.goto("/");
  await page.goto("/studio");
  await expect(page.getByRole("heading",{name:"Define authority outside the model."})).toBeVisible();
  await navigate("Overview");
  await expect(page.getByText("0 / 3",{exact:true})).toBeVisible();
  await expect(page.getByText("Not run",{exact:true}).first()).toBeVisible();
});

test("mobile menu opens and reaches Studio", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile project only");
  await page.goto("/");
  await page.getByRole("button", { name:"Open menu" }).click();
  await expect(page.getByRole("navigation", { name:"Mobile navigation" })).toBeVisible();
  await page.getByRole("navigation", { name:"Mobile navigation" }).getByRole("link", { name:"Case study", exact:true }).click();
  await expect(page).toHaveURL(/case-study/);
});

test("unknown route has a useful recovery path", async ({ page }) => {
  await page.goto("/not-a-real-workflow");
  await expect(page.getByRole("heading", { name:/outside the workflow/ })).toBeVisible();
  await expect(page.getByRole("link", { name:"Open Studio" })).toHaveAttribute("href", "/studio");
});
