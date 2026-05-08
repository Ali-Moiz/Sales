## Create Proposal
1. Verify that all four overview tabs are visible on deal detail page.
2. Verify that Contract & Terms tab is visible on deal detail page.
3. Verify that Contract & Terms tab is selected by default.
4. Verify that Contract & Terms empty state renders correct UI elements.
5. Verify that Create Proposal drawer contains all expected fields.
6. Verify that Dedicated / Patrol is the default selected service type.
7. Verify that service type can be switched to Dispatch Only.
8. Verify default Proposal Name is pre-filled with Deal Name (linked by default).
9. Verify user can edit Proposal Name and updated value is used throughout contract (wizard header/contract card).
10. Verify Proposal Name is required and cannot be blank; show validation on Create Proposal.
11. Verify that Time Zone trigger is visible and displays a UTC label.
12. Verify Time Zone is required and user can select Eastern Time (UTC-05:00); selection is saved for contract.
13. Verify Create Proposal blocked when Time Zone is not selected; show required validation.
14. Verify that Contract Dates to be decided checkbox is unchecked by default.
15. Verify that date fields are visible by default in Create Proposal drawer.
16. Verify that checking Contract Dates to be decided hides all date fields.
17. Verify that unchecking Contract Dates to be decided restores date fields.
18. Verify selecting 'Contract Dates to be decided' allows proceeding without Start/End/Renewal dates and contract still created.
19. Verify contract dates behavior: user can set Start Date + (End Date OR Renewal Date).
20. Verify Start Date is required when 'Contract Dates to be decided' is unchecked.
21. Verify that Renewal Date is selected by default in the date type radio.
22. Verify End Date and Renewal Date are mutually exclusive (radio behavior) and proper field becomes required accordingly.
23. Verify that selecting End Date switches the date type selection.
24. Verify Renewal Date cannot be earlier than Start Date; show validation/error.
25. Verify End Date cannot be earlier than Start Date; show validation/error.
26. Verify Auto Renewal of Contract check box can be checked and value persists in Create Proposal drawer (covered by TC-CONTRACT-007).
27. Verify that Notify for Renewal field is visible in default drawer state.
28. Verify that Notify for Renewal Before Days defaults to 10.
29. Verify Notify for Renewal Before (Days) is required (when renewal is enabled) and only accepts valid numeric range (no letters/negative).
30. Verify user can cancel Create Proposal modal and no proposal/contract is created.
31. Verify that Create Proposal drawer can be reopened after cancel.

## Contract Wizard
32. Verify contract wizard steps are displayed (1 Services, 2 Devices, 3 On Demand, 4 Payment Terms, 5 Description, 6 Signees) for Dedicated Proposal.
33. Verify that Step 1 Services is visible with all required fields.
34. Verify user can select Dedicated Service vs Patrol Service and relevant fields display accordingly.
35. Verify Service Name is required; leaving blank shows 'Service Name is required'.
36. Verify Resource Type is required; leaving blank shows 'Resource Type is required'.
37. Verify Line Item is required; leaving blank shows 'Line Item is required'.
38. Verify Service Start Date is required; leaving blank shows validation.
39. Verify Officer/Guard count is required and must be a positive integer.
40. Verify Hourly Rate is required and accepts valid currency format; reject letters/special chars.
41. Verify at least one Job Day selection is required (if applicable); show validation if none selected.
42. Verify Start Time and End Time validations: end time must be after start time (including overnight rules if supported).
43. Verify Include Fuel Surcharge and Include Vehicle toggles can be enabled and reflect in totals/pricing where applicable.
44. Verify Add Instructions rich text supports formatting (bold/italic/list/headings) and content saves.
45. Verify Additional Services toggles (e.g., Visitor Management, Load Management) can be selected and persist.
46. Verify user can add multiple services (Service #1, Service #2) and totals reflect aggregated services.
47. Verify deleting a service updates totals and does not break remaining service forms.
48. Verify Save & Next is blocked when mandatory fields on current step are missing.
49. Verify Save & Next progresses to next step and preserves entered data when navigating back.
50. Verify Devices list (NFC Tags, Beacons, QR Tags) renders with unit price and quantity controls.
51. Verify quantity +/- updates Total Price and contract total appropriately.
52. Verify quantity cannot go below 0 and cannot accept non-numeric input.
53. Verify unit price cannot accept negative value and uses numeric validation.
54. Verify note 'Billed in first invoice only' (if present) remains visible and accurate.
55. Verify that Step 3 On Demand is visible and advances to Step 4.
56. Verify Dispatch Request billing type dropdown loads and can be set (other options).
57. Verify Price Per Hour field validates numeric and rejects negative/alpha.
58. Verify adding additional on-demand line items (via + Line Item) works and persists.
59. Verify removing a line item updates totals and does not leave orphan fields.
60. Verify that Step 4 Payment Terms shows all three sections.
61. Verify payment plan columns render (Monthly, Bi-Weekly, Weekly, Event, Flat) and selecting a plan highlights it.
62. Verify Services Total/Dispatch Total/Tax Rate/Total update for selected plan.
63. Verify Tax Rate (%) is required and validates numeric range (0-100) and decimals; reject alpha/negative.
64. Verify Contract Duration displays based on Start/End/Renewal dates selected in proposal.
65. Verify required fields under 'Define Payment Terms' can be selected: Cycle Reference Date, Payment Terms, Payment Method, Billing Type, Contract Type, Billing Frequency.
66. Verify Officer/Guard Breaks checkboxes (Billable/Payable) can be toggled and saved.
67. Verify Holiday Multiplier and Holiday Group selection works; '0 Holidays' link/info is accessible (if applicable).
68. Verify that only the holiday groups linked to the selected franchise in the property are visible in the dropdown.
69. Verify Annual Rate Increase validates numeric percent and rejects invalid formats.
70. Verify Flat plan input validation (flat amount required, numeric only).
71. Verify Services Profitable indicator updates (0/1 etc.) and tooltip/message is readable.
72. Verify Billing Information required fields: First Name, Last Name, Email, Phone Number validate correctly.
73. Verify Email field validation for invalid formats (missing @, domain, spaces).
74. Verify Phone Number accepts valid numbers and country code; reject letters and too short/long values.
75. Verify Address/Country/State/City/Zip are prefilled from property and are consistent.
76. Verify 'Use a different billing address' reveals editable address fields and saves the alternate billing address.
77. Verify Save & Next blocked until required payment term fields are completed; show field-level errors.
78. Verify that Step 5 Description is pre-filled and advances to Step 6.
79. Verify Description step loads with banner upload area and Description of Services rich text editor.
80. Verify description content is auto-generated based on contract configuration from prior steps (services, days/times, guards, breaks, rate).
81. Verify user can edit generated description and changes persist after navigating away/back.
82. Verify banner image upload supports click + drag/drop and accepts allowed size/dimension constraints; shows preview.
83. Verify invalid banner file types (e.g., .exe) are rejected with clear error.
84. Verify banner file > max size is rejected with clear error.
85. Verify that Step 6 Signees shows default signee and Finish button.
86. Verify default Signee 1 is populated (e.g., Deal Owner/Sales Manager) when applicable.
87. Verify Add Signee opens drawer and requires Name, Title, Email.
88. Verify Add Signee cannot be saved with missing required fields; show validation messages.
89. Verify Add Signee email validation prevents invalid email formats.
90. Verify multiple signees can be added and appear as separate signee cards.
91. Verify Preview generates contract preview successfully and matches entered details (proposal name, billing plan, services).
92. Verify Finish is blocked if no signee exists (if required by system) or shows guidance to add at least one signee.
93. Verify Finish creates contract and returns to Deal Details > Contract & Terms with contract card visible.
94. Verify contract card shows: Proposal Name, Billing (e.g., $200 Weekly), Created date, 'by <user>', and action icons (edit/duplicate/pdf/delete as available).
95. Verify totals are consistent across wizard steps and final contract card (e.g., USD 200 Weekly).

## Publish Contract & Request Signatures
96. Verify that proposal card is visible with Publish Contract button and expected actions.
97. Verify Publish Contract button is visible after contract creation and opens publish flow successfully.
98. Verify attempting to Publish with incomplete required contract fields is blocked and shows error (if applicable).
99. Verify if user publishes contract before manually updating stage, system shows 'deal stages update' popup and handles update.
100. Verify that Publish Contract after deal close opens confirmation modal.
101. Verify that confirming Publish Contract marks the contract as Published.
102. Verify Request Signatures opens selection modal listing all signees with status tags.
103. Verify default status tag is 'Not Requested' for signees who were not sent a request.
104. Verify selecting a signee and clicking Request Signatures sends email and updates status tag to 'Requested'.
105. Verify Request Signatures is blocked if no signee is selected show validation/toast.
106. Verify when a signee signs, status tag updates to 'Signed' in Request Signatures modal.
107. Verify email delivery failure (simulate/forced) shows error and status does not incorrectly change to Requested.
108. Verify deal stage auto-moves to Negotiation after sending signature request when deal was in Proposal Creation.
109. Verify with multiple signees, partial signing keeps stage as Negotiation and tags reflect Requested/Signed/Not Requested correctly.
110. Verify with multiple signees, deal does NOT move to Closed Won until all signees have Signed.
111. Verify once all signees sign, deal stage moves to Closed Won automatically.
112. Verify once all signees sign, 'Request Signatures' text disappears from contract card (no longer shown).

## Close Deal & Contract Actions
113. Verify Close button opens Close Deal modal with options Closed Won / Closed Lost.
114. Verify Save is disabled until HubSpot Stage to map is selected.
115. Verify closing as Closed Won updates stage and shows confirmation/toast.
116. Verify closing as Closed Lost updates stage and shows confirmation/toast.
117. Verify cancel closes modal without changing deal stage.
118. Verify refreshing the Deal Details page retains contract card and statuses (Requested/Signed) remain correct.
119. Verify unauthorized user/role cannot edit/publish/request signatures when permissions are restricted (if roles exist).
120. Verify that the Clone button is visible when the contract is created and that the user is able to clone the contract.
121. Verify that the PDF View button is visible to the user and allows the user to view the contract in PDF format.
122. Verify that the Delete Contract button is visible before the contract is published and that the user is able to delete the contract.
123. Verify that when the user attempts to delete the contract, a confirmation popup appears asking whether to delete the proposal or not.
124. Verify that once the contract is published, the user is able to terminate the contract.
125. Verify that the Addendum button is visible once the contract has started.
126. Verify that when a user creates an addendum for a proposal, the user is able to edit the proposal.
127. Verify that once the user publishes the addendum proposal, the status tag 'Not Acknowledged' appears on the Edge site.
128. Verify that after the addendum contract is acknowledged on the Edge site, the 'Acknowledged' tag appears on the proposal.
129. Verify that once the addendum contract is acknowledged on the Edge site, the parent contract's deal stage on the SET side is marked as 'Expired.'

## Clone Contract
130. Verify Clone button visibility
131. Verify Clone button disabled without permission
132. Verify that contract can be cloned when it is Unpublished
133. Verify that contract can be cloned when it is Published but unsigned
134. Verify that contract can be cloned when it is Published and signed
135. Verify that contract can be cloned when Addendum exists
136. Verify that contract can be cloned when it is already cloned
137. Verify that terminated contract can be cloned
138. Verify that new contract is created after cloning
139. Verify that cloned contract retains structure
140. Verify that cloned contract has unique ID
141. Verify that sensitive data is cleared in cloned contract
142. Verify that signatories are removed in cloned contract
143. Verify that signature status is reset
144. Verify that contract dates are editable
145. Verify that user can edit all fields
146. Verify validation works in cloned contract
147. Verify cloning fails on API error
148. Verify cloning fails on session timeout
149. Verify cloning works for large contracts

## Contracts - Addendum (Dedicated)
150. Verify Addendum button visibility based on eligibility
151. Verify disabled state styling for Addendum button
152. Verify that Addendum can be created for a published and synced contract
153. Verify that Addendum cannot be created if contract is not published
154. Verify that Addendum cannot be created if contract is not synced to Edge 2.0
155. Verify that Addendum cannot be created when contract has fewer than 7 days remaining
156. Verify that Addendum button is disabled when only 1 day remains
157. Verify that Addendum is not allowed for Not Started contract
158. Verify that a new deal is created when Addendum is initiated
159. Verify that Addendum contract is created within new deal
160. Verify that parent contract remains unaffected before publication
161. Verify parent jobs remain active before effective date
162. Verify that effective date acts as start date of Addendum
163. Verify that effective date updates parent contract end date
164. Verify system prevents selecting past effective date
165. Verify Addendum becomes independent contract
166. Verify that second Addendum cannot be created from same parent
167. Verify that Addendum contract can act as parent after publishing
168. Verify system blocks multiple Addendum attempts simultaneously
169. Verify change history is displayed during publication
170. Verify change history includes all elements
171. Verify shuffled detailed history still accurate
172. Verify correct pill label states
173. Verify Not Acknowledged label appears
174. Verify acknowledgment before effective date works
175. Verify acknowledgment during active period updates dates
176. Verify acknowledgment after gap creates service gap
177. Verify acknowledgment not allowed after end date
178. Verify Not Acknowledged remains after expiry
179. Verify only View allowed after expiry without acknowledgment
180. Verify Acknowledged label appears
181. Verify acknowledgment timestamp is displayed
182. Verify notification is sent upon acknowledgment
183. Verify notification title is correct
184. Verify notification description contains contract name

## Contract - Addendum (Patrol)
185. Verify that Addendum can be created for eligible contract
186. Verify that Addendum button is hidden for draft contract
187. Verify that Addendum creation is blocked if contract not synced
188. Verify that Addendum cannot be created when less than 7 days remaining
189. Verify that Addendum button is disabled when 1 day remaining
190. Verify that Addendum is not available for not started contract
191. Verify that new deal is created on Addendum creation
192. Verify that parent contract remains unchanged before publish
193. Verify that effective date updates parent contract end date
194. Verify that Addendum becomes independent contract after publish
195. Verify that second Addendum cannot be created
196. Verify that change history is displayed on publish
197. Verify that Not Acknowledged label appears
198. Verify acknowledgment before effective date
199. Verify acknowledgment during contract updates start date
200. Verify acknowledgment after end date is blocked
201. Verify only View action enabled after expiry without acknowledgment
202. Verify Acknowledged label after acknowledgment
203. Verify acknowledgment timestamp is shown
204. Verify notification is sent after acknowledgment

## Contract Auto-Renewal - Edit Function Enhancement (SET)
205. Verify that renewal notification email is sent on Renewal Date - N days
206. Verify that draft renewal contract is created automatically
207. Verify that auto rate increase is applied in draft
208. Verify Annual Rate Increase is mandatory at contract creation
209. Verify task is created when draft renewal is generated
210. Verify task fields are correct
211. Verify Publish Date is auto-set
212. Verify user can edit Publish Date
213. Verify auto-publish happens on Publish Date
214. Verify manual publish triggers change summary modal
215. Verify change summary excludes auto rate increase
216. Verify change summary includes manual edits
217. Verify approval required when pricing below threshold
218. Verify fallback to original contract if approval not completed
219. Verify draft becomes Discarded after fallback
220. Verify discarded draft is view-only
221. Verify discarded draft can be deleted
222. Verify status shows Acknowledged when no manual changes
223. Verify status shows Not Acknowledged when manual changes exist
224. Verify status updates after EDGE acknowledgment
225. Verify signature required when manual changes exist
226. Verify no signature required when only rate increase applied
227. Verify user publishes immediately after notification
228. Verify auto-publish occurs if user takes no action
229. Verify system handles multiple contracts auto-renewal
230. Verify renewal task due date equals Publish Date
231. Verify renewal email contains correct details
232. Verify system handles API failure during auto-publish
233. Verify user cannot edit after publish
234. Verify rate increase does not count as manual change

## Contract Addendum - Impact on Edge 2.0
235. Verify that banner is displayed when addendum arrives
236. Verify that notification is sent to FO and Supervisor
237. Verify that daily notification is sent until acknowledged
238. Verify that clicking banner opens addendum popup
239. Verify that multiple addendums show selection dropdown
240. Verify that single addendum opens directly
241. Verify that services added are displayed correctly
242. Verify that removed services are displayed
243. Verify that changed services show before/after
244. Verify that device changes are shown
245. Verify that on-demand service changes are shown
246. Verify that payment term changes are shown
247. Verify that description changes are shown
248. Verify that signee changes are displayed
249. Verify that shift removal selection works
250. Verify that Next button saves progress
251. Verify that Acknowledge button completes process
252. Verify that Cancel discards changes
253. Verify that dashboard shows addendum metric
254. Verify metric removed after acknowledgment
255. Verify contract listing shows Not Acknowledged
256. Verify contract becomes Active after acknowledgment
257. Verify parent contract end date updated
258. Verify schedule updates for added services
259. Verify removed services disappear from schedule
260. Verify shifts unassigned after change
261. Verify acknowledgment before effective date
262. Verify acknowledgment during active period
263. Verify acknowledgment after contract end is blocked
264. Verify banner not shown after acknowledgment

## Contract Auto-Renewal - Edit Function Enhancement (EDGE)
265. Verify that no notification is sent when renewal has no manual edits
266. Verify that notification is sent when renewal has manual edits
267. Verify that daily notifications are sent until acknowledgment
268. Verify that banner is displayed on site when manual changes exist
269. Verify that banner is not displayed when no manual edits exist
270. Verify that clicking Review & Acknowledge opens modal
271. Verify that Select Contract modal appears for multiple renewals
272. Verify that single contract opens directly
273. Verify acknowledgment button works
274. Verify banner disappears after acknowledgment
275. Verify shifts created automatically for no-edit renewal
276. Verify last-week assignment duplication works
277. Verify shifts editable after duplication
278. Verify shifts generated but unassigned for changed services
