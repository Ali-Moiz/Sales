# Property Test Cases - Categorized

## Describe: Create Property Workflow
1. Verify that user is able to create to create new property.
2. Verify that the Create Property modal opens successfully from the Properties/Listing page.
3. Verify that the Create Property modal displays all expected fields, labels, and mandatory (*) indicators.
4. Verify that the close (X) icon closes the Create Property modal without saving any data.
5. Verify that the Cancel button closes the Create Property modal without saving any data.
6. Verify that validation message appear if user try to create a property by clicking on the 'Create Property' button when mandatory fields are empty
7. Verify that the Company dropdown opens and lists companies correctly.
8. Verify that the Company dropdown supports search and returns matching company results.
9. Verify that selecting a company populates the Company field correctly.
10. Verify that changing the selected company updates dependent fields (if any) accordingly.
11. Verify that Property Affiliation options become visible/enabled after the user selects a company.
12. Verify that Property Affiliation options display all expected chips/options (e.g., Managed, Owned, Regional Office, Shared, Tenant, Headquarters) after company selection.
13. Verify that user can select a Property Affiliation option and the selection state is clearly shown.
14. Verify that user can select the multiple property affiliation option at a same time.
15. Verify that clicking '+ Create New' in Company section opens the Create New Company flow.
16. Verify that returning from Create New Company flow preserves Create Property modal state (if supported).
17. Verify that Parent Company field is visible.
18. Verify that Property / Property Name text field is visible and marked mandatory.
19. Verify that Property Source dropdown opens and lists all available sources correctly.
20. Verify that selecting a Property Source populates the field correctly.
21. Verify that Associated Franchise dropdown opens and lists available franchises correctly.
22. Verify that Associated Franchise dropdown supports search and returns matching results.
23. Verify that selecting an Associated Franchise populates the field correctly.
24. Verify that 'Choose a Hubspot Stage to map' dropdown opens and lists available stages correctly.
25. Verify that selecting a Hubspot Stage populates the field correctly.
26. Verify that Property Affiliation value displays as N/A before company selection (as shown).
27. Verify that Select Assignee dropdown opens and lists assignees/users correctly.
28. Verify that Select Assignee dropdown supports search and returns matching assignees.
29. Verify that selecting an assignee populates the field correctly.
30. Verify that the 'Assign Supervisor' checkbox is visible and can be checked/unchecked.
31. Verify that the 'Assign Supervisor' checkbos is disabled when user select the HO user as a Assginee
32. Verify that checking 'Assign Supervisor' reveals the 'Select Supervisor' field.
33. Verify that 'Select Supervisor' becomes mandatory when 'Assign Supervisor' is checked.
34. Verify that Select Supervisor dropdown opens and lists supervisors/users correctly.
35. Verify that unchecking 'Assign Supervisor' hides the Supervisor field and clears its selected value (if any).
36. Verify that Contact Details section is visible with correct contact roles (Decision Maker, End User, Billing, etc.).
37. Verify that each Contact role dropdown opens and lists contacts correctly.
38. Verify that each Contact role dropdown supports search and returns matching contacts.
39. Verify that user can select contacts for multiple roles and selections are displayed correctly.
40. Verify that selecting the same contact in multiple roles is allowed only if permitted by business rules (handled correctly).
41. Verify that Address field is visible, marked mandatory, and accepts typing to search addresses.
42. Verify that address search shows suggestions (if integrated) and user can select an address.
43. Verify that selected address is populated in the Address field correctly.
44. Verify that the map renders correctly on the Create Property modal.
45. Verify that the map updates/centers to the selected address location.
46. Verify that scrolling within the modal allows access to all sections without layout breaking.
47. Verify that long dropdown values (company/property/address) truncate or wrap without UI break.
48. Verify that keyboard navigation (Tab/Shift+Tab) moves focus through fields in a logical order.
49. Verify that pressing ESC closes an open dropdown list (if supported) without closing the entire modal.
50. Verify that the user can successfully create a property by filling all mandatory fields and clicking 'Create Property'.
51. Verify that after successful creation, the modal closes and the new property appears in the relevant listing/details view.
52. Verify that the system shows a success toast/message after property creation.
53. Verify that the Referred By section is visible when the user selects Property Source as 'Referral'.
54. Verify that the Referred By section is hidden when Property Source is not 'Referral'.
55. Verify that the Referred By Property dropdown becomes visible/active when Property Source is 'Referral'.
56. Verify that the Referred By Property dropdown lists only existing properties (no free-text/non-existing values).
57. Verify that selecting a Referred By Property populates the field correctly.
58. Verify that the Referred By Contact dropdown becomes visible/active after selecting a Referred By Property (if dependent).
59. Verify that the Referred By Contact dropdown shows only contacts associated with the selected Referred By Property.
60. Verify that changing the Referred By Property refreshes the Referred By Contact list accordingly.
61. Verify that clearing the Referred By Property clears the Referred By Contact selection (if any).
62. Verify that required-field validation messages are cleared once the user enters valid values.
63. Verify that previously entered values remain intact when user opens/closes dropdowns repeatedly.
64. Verify that the modal backdrop prevents interaction with the background page while modal is open.
65. Verify that the modal retains user input when a validation error occurs on submission.
66. Verify that the modal handles slow loading of dropdown data by showing a loader/state (if applicable).
67. Verify that duplicate address is rejected with geocoordinate error.
68. Verify that Create Property button opens Create Property modal

## Describe: Properties Dashboard & Listing
69. Verify that Properties dashboard loads successfully with correct total counts
70. Verify that Properties by Stage chart displays correct stage-wise distribution
71. Verify that Qualified Properties graph renders correctly
72. Verify that property list loads with default All Affiliation filter applied
73. Verify that user can search property by name, ID, zip code
74. Verify that Approved and Rejected stage filter works correctly
75. Verify that All Properties dropdown filters Assigned and Unassigned properties
76. Verify that sorting works on Property Name column
77. Verify that Property Affiliation tags are displayed correctly
78. Verify that pagination works correctly
79. Verify that user can select single property using checkbox
80. Verify that user can select multiple properties
81. Verify that Bulk Assignment button becomes enabled after selection
82. Verify that Bulk Assignment assigns properties successfully
83. Verify that Review Leads button opens review leads modal
84. Verify that Property Stage badges display correct status
85. Verify that Assigned To column shows correct user
86. Verify that Franchise column shows correct value
87. Verify that Created Date and Last Modified Date are displayed correctly
88. Verify that More Filters panel opens successfully
89. Verify that Property Type filter works correctly
90. Verify that Stage filter work correctly
91. Verify that Property Source filter works correctly
92. Verify that Country, State, City filters work correctly
93. Verify that Zip Code filter accepts valid values
94. Verify that Parent Company filter works correctly
95. Verify that Property ID filter works correctly
96. Verify that Associated Franchise filter works correctly
97. Verify that Assigned To filter works correctly
98. Verify that No. of Units filter works correctly
99. Verify that Lot Number filter works correctly
100. Verify that Created Date filter works correctly
101. Verify that Last Modified Date filter works correctly
102. Verify that Clear All resets all applied filters
103. Verify that Apply Filters updates property listing correctly
104. Verify that searching with a non-existent property name returns no results.
105. Verify that Properties module opens successfully.

## Describe: Property Details & Management
106. Verify that user is able to view details of property.
107. Verify that user is able to edit property.
108. Verify that user is able to assign levels to the property.
109. Verify that HO/SM is able to assign property to the manager or sales person.
110. Verify that HO/SM/SP is able to link franchise.
111. Verify that the user is able to update the property, and that the Update modal displays all the information that the user entered when creating the property.
112. Verify that Property detail page shows all sidebar sections.
113. Verify that Property detail page shows stage bar and all 6 overview tabs.
114. Verify that Edit Property form opens pre-filled and Save remains disabled without changes.

## Describe: Activities & Logs
115. Verify that activities logs load for different record types
116. Verify that email log title uses sender username
117. Verify that email subject matches email creation form
118. Verify that email HTML formatting: bold/italic/underline
119. Verify that email HTML formatting: lists
120. Verify that email HTML formatting: links
121. Verify that email long body truncation threshold
122. Verify that email See more expands without losing formatting
123. Verify that email See less returns to original scroll position
124. Verify that email timestamp displays and is correct
125. Verify that email log ordering relative to other logs
126. Verify that note log title uses creator username
127. Verify that note HTML formatting: bullets/links
128. Verify that note long text truncation + See more/less
129. Verify that note update reflects new content + user + timestamp
130. Verify that note update without content change
131. Verify that meeting log title uses creator username
132. Verify that meeting displays meeting title field
133. Verify that meeting link displayed and clickable
134. Verify that meeting description displayed
135. Verify that meeting guests displayed as tags
136. Verify that meeting missing fields show N/A individually
137. Verify that meeting expand/collapse reveals full details
138. Verify that meeting update reflects changes + timestamp
139. Verify that call log title uses logger username
140. Verify that call long description truncation + toggle
141. Verify that call timestamp correctness
142. Verify that task log title uses creator username
143. Verify that task fields render: title/type/priority/description/status
144. Verify that task missing type shows N/A
145. Verify that task missing priority shows N/A
146. Verify that task long description truncation + toggle
147. Verify that task update reflects new content + updater + timestamp
148. Verify that real-time update without manual refresh
149. Verify that permissions: unauthorized user cannot see logs
150. Verify that Activities tab loads and shows at least one dated entry.

## Describe: Notes Management
151. Verify that user is able to add/edit/delete notes.
152. Verify that Subject field is mandatory while creating a note
153. Verify that Description field is mandatory while creating a note
154. Verify that system shows validation error when Subject is empty
155. Verify that system shows validation error when Description is empty
156. Verify that note count updates after adding a note
157. Verify that edited note shows updated content in listing
158. Verify that delete confirmation modal appears before deleting note
159. Verify that note is not deleted when cancel is clicked on confirmation modal
160. Verify that empty state is shown again after deleting last note
161. Verify that user cannot save note when required fields are missing
162. Verify that Notes tab is visible and Create New Note drawer opens with correct fields.

## Describe: Task Management
163. Verify that user is able to add tasks.
164. Verify that user is able to mark the task as complete.
165. Verify that Task Title field is mandatory while creating a task
166. Verify that Task Description field is mandatory while creating a task
167. Verify that Type field is mandatory while creating a task
168. Verify that Priority field is mandatory while creating a task
169. Verify that Due Date field is mandatory while creating a task
170. Verify that system shows validation error when required fields are missing
171. Verify that user can filter tasks by Type
172. Verify that user can filter tasks by Priority
173. Verify that user can filter tasks by Status
174. Verify that user can filter tasks by Due Date range
175. Verify that user can search tasks using Search by Title
176. Verify that user can edit an existing task
177. Verify that edited task details are updated in listing
178. Verify that user can delete a task after confirmation
179. Verify that task is not deleted when delete action is cancelled
180. Verify that completed task is shown under Completed status filter
181. Verify that unchecking completed checkbox marks task as To-Do
182. Verify that pagination works correctly in task listing
183. Verify that tasks are sorted correctly by Due Date
184. Verify that Tasks tab shows expected columns, New Task button, and empty state.
185. Verify that Create New Task drawer opens with all required fields.
