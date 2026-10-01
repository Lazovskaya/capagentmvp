## Business Capability Delivery Guide

## Module LeanIX Setup

- it's recommended to utilize the standard meta-model from LeanIX for Business Capability. Use the Business Capability factsheet type for modelling capabilities, and the Application factsheet type for applications.

## LeanIX Setup – Meta Model – Fact Sheet Type

1. Go to *Administration*  *Meta Model Configuration*

2. Select Fact Sheet *Business Capability*

3. Add the following fields with given attribute values

   - Scope – In scope, Out of scope, To be decided,
   - Classification ( Pain point/Opportunity) : Opportunity, Pain point, Neutral
   - Ownership – Global, Regional, Local
   - Strategic Importance –Commodity, Innovation, Differentiation.
   - Level of Customization - High, Medium, Low
   - Reason for Customization  - text field
   - Standardization potential – High, Medium, Low
   - Innovation Potential – High, Medium, Low
   - Harmonization Potential -High, Medium, Low

**Note-**  Business capability classification attributes should be first agreed with the customer and then created in the SAP LeanIX and also check requirements from other modules in the scope of delivery

## LeanIX Setup – Meta Model – Fact Sheet Type

6\. Recommended Color codes for the attribute values

- In scope

  - Yes (#33cc58)
  - No (#f96464)
  - To be decided (#fad71e)

- Pain Point

  - Yes (#f96464)
  - No (#33cc58)

- Ownership

  - Global
  - Regional
  - Local

- Strategic Importance –

  - Commodity
  - Innovation
  - Differentiation

- Level of Customization –

  - High (#fc9785)
  - Medium( #fad71e)
  - Low (#33cc58)

- Standardization potential –

  - High  (#33cc58)
  - Medium ( #fad71e)
  - Low (#f96464)

- Innovation Potential –

  - High  (#33cc58)
  - Medium ( #fad71e)
  - Low (#f96464

## LeanIX Setup – Import Business Capabilities

To import business capabilities from the catalog, follow these steps

1. Go to the inventory.
2. On the right-side pane, under Reference Catalog, click Explore Business Capabilities.
3. On the page that appears, select the business capability hierarchies that you want to import, then click Import.
4. For more details refer product documentation [here ](https://help.sap.com/docs/leanix/ea/business-capabilities-in-reference-catalog?locale=en-US)

Importing Business Capability Maps from the Reference Catalog

## LeanIX Setup – Update the Business Capability Fact Sheet ( Manually)

1. *Navigate to the Fact Sheet:*

   - Go to the LeanIX workspace.
   - Select "Business Capabilities" from the menu.
   - Choose the specific Business Capability fact sheet you want to update.

2. *Edit Fact Sheet*:

   - Click on the "Edit" button located at the top right of the fact sheet.

3. *Update Basic Information:*

   1. Revise the "Name" and "Description" fields as needed.
   2. Ensure that the "Type" and "Subtype" fields are correctly set.

4. *Update Relations:*

   - Review and update relations to other fact sheets (e.g., Applications, IT Components, Data Objects).
   - Add or remove relations as necessary to reflect the current state.

5. *Update Tags and Attributes*:

   - Update tags to categorize the business capability appropriately.
   - Review and update custom attributes specific to your organization's needs.

**Note-**  Business capability classification attributes should be first agreed with the customer and then created in the SAP LeanIX and also check requirements from other modules in the scope of delivery

## LeanIX Setup – Update the Business Capability Fact Sheet ( via Import/Export)

To export fact sheet data, follow these steps:

1. Go the  SAP LeanIX **Inventory.**
2. Switch to table view by selecting the As Table icon. Although you can export data in list view as well, we recommend switching to table view. In table view, you can select and add specific fact sheet attributes you want to export, which isn't possible in the list view.
3. At the top right of the table, click the eye icon. This opens a panel for selecting the fact sheet attributes you want to export. Each selected attribute becomes a column in the table
4. Hover the curser over the three dots and then click on export

For more details refer the details  [here ](https://help.sap.com/docs/leanix/ea/exporting-fact-sheet-data-as-excel-file?locale=en-US)

To Import  factsheet data follow below steps

5. Create an [Import Template ](https://help.sap.com/docs/leanix/ea/importing-fact-sheet-data-through-excel-file?locale=en-US#step-1:-create-an-import-template)
6. Update the Data in the Spreadsheet ([ link](https://help.sap.com/docs/leanix/ea/importing-fact-sheet-data-through-excel-file?locale=en-US#step-2:-update-the-data-in-the-spreadsheet))
7. Upload the File, Review, and Correct Errors ( [link](https://help.sap.com/docs/leanix/ea/importing-fact-sheet-data-through-excel-file?locale=en-US#step-3:-upload-the-file,-review,-and-correct-errors))

For more details refer product documentation [here](https://help.sap.com/docs/leanix/ea/importing-fact-sheet-data-through-excel-file?locale=en-US)

Exporting Fact Sheet Data as an Excel File

## LeanIX Setup – Build Application Inventory in SAP LeanIX

To Import  factsheet data follow below steps

1. Create an [Import Template ](https://help.sap.com/docs/leanix/ea/importing-fact-sheet-data-through-excel-file?locale=en-US#step-1:-create-an-import-template)
2. Update the Data in the Spreadsheet ([ link](https://help.sap.com/docs/leanix/ea/importing-fact-sheet-data-through-excel-file?locale=en-US#step-2:-update-the-data-in-the-spreadsheet))
3. Upload the File, Review, and Correct Errors ( [link](https://help.sap.com/docs/leanix/ea/importing-fact-sheet-data-through-excel-file?locale=en-US#step-3:-upload-the-file,-review,-and-correct-errors))

For more details refer product documentation [here](https://help.sap.com/docs/leanix/ea/importing-fact-sheet-data-through-excel-file?locale=en-US)

- To create this report , create a  new Landscape report with fact sheet type as “Business capability”
- In the view drop down select “ Scope”
- Select ***stacked*** layout mode

LeanIX Setup – Reports – Business capability heatmaps

In scope/out of scope

- To create this report , create a  new Landscape report with fact sheet type as “Business capability”
- In the view drop down select “ Scope”
- In report setting  select the **Pain point** as left Property and **Strategic importance** as right property.

LeanIX Setup – Reports – Business capability heatmaps

*In scope/out of scope with pain points and strategic importance*

- To create this report , create a  new Landscape report with fact sheet type as “Business capability”
- In the view drop down select “ Strategic Importance ”
- In report setting  select the **Current Maturity** as left Property and **Target maturity** as right property.

LeanIX Setup – Reports – Business capability heatmaps

*Current Maturity with Target Maturity  with strategic importance*

- To create this report , create a  new Landscape report with fact sheet type as “Business capability”
- In the view drop down select “ Innovation Potential” .

LeanIX Setup – Reports – Business capability heatmaps

*Innovation potential*

- To create this report , create a  new Landscape report with fact sheet type as “Business capability”
- In the view drop down select “ Lifecycle”
- Select the initiative
- Use the time line and view the AS IS and TO BE Business capability map.

LeanIX Setup – Reports – Business capability heatmaps

*AS IS and To Be Capability Map*

- **Business Capabilities to Products**

  - Map  Business capabilities to AS IS /TO BE applications via Initiatives

  - For Product Maps use [Landscape](<(https:/docs-eam.leanix.net/docs/step-4-evaluate-your-target-architecture>) reports (Apps by Capability) or [Matrix](https://docs-eam.leanix.net/docs/matrix-report)

    - Use lifecycle view to generate AS IS and TO BE  Application map

  - For Multiple Heatmaps  see [Application Portfolio Assessment](https://help.sap.com/docs/leanix/ea/application-portfolio-assessment?locale=en-US)

## LeanIX Setup – Reports – Business Capabilities to Products

1

2

3

- **Business Footprint Diagram**

  - Report type: matrix
  - Select base fact sheet type: business capability

## LeanIX Setup – Reports – Business Footprint Diagram

## Module Scope

**Business Architecture**

## SAP Enterprise Architecture Methodology Artifacts

**Solution** \
**Architecture**

**Strategy & Motivation**

**Technology**\
**Architecture**

**Roadmap &**\
**Transition**

**Architecture**\
**Vision**

Architecture Roadmap

Work Breakdown Structure

Environments & Location Diagram

Solution Context Diagram

Solution Concept Diagram

Stakeholder \
Map

Statement of Architecture Work

**Requirements and Governance**

Requirements Catalog

Risk Catalog

Architecture Decisions Catalog

Business Strategy Map

Business Model Canvas

Business\
Capability Map

Business\
Process Catalog

Business Value Flow Diagram

Organization \
Map

Business

Data Catalog

Business\
Role Catalog

Business Footprint Diagram

Product Map

Solution Component Diagram

Solution Value Flow Diagram

Solution Data Flow Diagram

Software Distribution Diagram

Application Architecture Overview Diagram

Conceptional Data Diagram

Business Context Diagram

Architecture Principles Catalog

Solution Process Flow Diagram

EA Practice Assessment

Business and Technology Transformation Readiness Assessment

To be discussed

> **EAM Domain Color HEX codes:**
>
> **Architecture Vision - 049F9A**
>
> **Strategy and Motivation - 7858FF**
>
> **Business Architecture - 1B90FF**
>
> **Solution Architecture - FFC000**
>
> **Technology Architecture – C35500**
>
> **Opportunities and Migration - 7F7F7F**
>
> **Requirements and Governance- 71014B**

## Module Delivery steps

**Preparation**

**Preparation**

**Preparation**

**Preparation**

**Preparation**

**Workshop: As-Is Review (LoB specific)**

**Workshop: To-Be Review**

**(LoB  Specific)**

**Final Results**

**Preparation**

**Workshop: Baseline Preparation\***

\* Required by Functional Stream

Review To BE Strategy map

Understand as-is capabilities and mapping of current applications to capabilities.

Agree on the classification criteria and reports

Prepare first draft of business capability inventory in SAP LeanIX

LoB specific deep-dive to better understand functional requirements.

Present the final Business Capability assessment results

Lob Specific- Review target business capability and application mapping.

Understand pain points, opportunity areas and innovation needs

Review the Business capability assessment results

- Current Maturity vs Target Maturity
- Pain points and opportunity areas
- As IS and To BE business capability model
- Innovation Areas
- As IS and To BE product map.

Update the draft business capability heatmaps in SAP LeanIX

Review baseline business capability map and application mapping in SAP LeanIX.

## Business Capability – Delivery steps Overview

Step 1

Step 2

Step 3

Step 4

**Preparation**

**Preparation**

**Preparation**

**Preparation**

**Preparation**

**Workshop: As-Is Review (LoB specific)**

**Workshop: To-Be Review**

**(LoB  Specific)**

**Final Results**

**Preparation**

**Workshop: Baseline Preparation\***

\* Required by Functional Stream

## Business Capability – Delivery steps Overview

Step 1

Step 2

Step 3

Step 4

Review the Customer Strategy Map or the strategy map generated in Strategy module.

**Workshop: Baseline Preparation\***

Step 1-Baseline Preparation

Preparation Steps to be executed by SAP Enterprise Architect**.**

While going through the Customer’s Strategy Map understand the below points

**Customer’s Strategic Priorities, Goals, and Objectives:**

- Review  the key strategic priorities, goals and objectives and understand how these goals and objectives align with the customer's overall business strategy.

**Business Capabilities supporting each Objective:**

- Identify the specific business capabilities required to achieve each goal and objective.
- Assess the current state of these capabilities and any gaps that need to be addressed (Current Maturity vs Target Maturity – if available)

**Applications supporting  Business Capabilities** (If available)

- Which SAP/Non SAP applications (software, systems, tools) are utilized to support each business capability.
- Analyse how well these applications enable and enhance the business capabilities. (current fulfilment levels)
- Identify any areas where additional or improved applications are needed to better support the capabilities (opportunity areas)

**Relationship Between Business Capabilities/Applications and Organizational Units (Business Unit):**

- Understand the Customer’s high level organizational structure to understand which business units or departments in scope of service.
- Which applications are used within and across different organizational units. (if available)
- Alignment between the business capabilities, the applications supporting them, and the organizational units responsible for their execution.

- Understand as-is capabilities and mapping of current applications to capabilities.
- Agree on the Classification criteria and reports

**Workshop: Baseline Preparation\***

Step 1-Baseline Preparation

- Create initial business capability Map in SAP LeanIX based on the customer’s industry  and known LoB Scope of service or re-use the business capability map created in the Strategy Module. Follow the steps as mentioned in [Reference Business Architecture](https://docs-eam.leanix.net/docs/reference-business-architecture)

  - In SAP LeanIX, import business capabilities from best-practice, industry-specific business capability maps and customize them to suit your organization’s needs, Follow the steps as mentioned in [Reference Business Architecture ](https://docs-eam.leanix.net/docs/reference-business-architecture) (Select industry maps as per your customer need, Administrator role is mandatory to perform these activities)

- Download the business capability map and per LoB area( L1-L3) and adjust this as per [template](https://sap.sharepoint.com/:x:/r/teams/TransformationHubCoreConfidential/Shared%20Documents/General/02_Initiatives/Modularization/2025%20Module%20Development/Business%20Capability/Business%20Capability%20Data%20Collection%20Template%20V1.0.xlsx?d=w23c39f73ad004bfda9b372638a17c50c&csf=1&web=1&e=8SMAMw)

- In the workshop discuss and agree with the customer - scope of Business capabilities (L1-L3)  for assessment (2-3 critical LoBs are recommended. Also note down any additional business capabilities to be added which are not part of the SAP standard RBA content in SAP LeanIX . If required, involve SAP Solution Expert for the workshop

- Agree on the business capability classification criteria

  - Scope – In scope, Out of scope, To be decided,.
  - Classification - Opportunity, Pain point, Neutral
  - Ownership – Global, Regional, Local
  - Current Maturity / Target Maturity
  - Strategic Importance –Commodity, Innovation, Differentiation.
  - Level of Customization
  - Reason for Customization
  - Standardization potential
  - Innovation Potential
  - Harmonization Potential
  - Lifecycle Status

- Update the business capability factsheet metamodel as per the agreed classification attributes

- Get  list of existing SAP/Non applications  in customer IT landscape (with Software version, End of maintenance unit using application). Use [template](https://sap.sharepoint.com/:x:/r/teams/TransformationHubCoreConfidential/Shared%20Documents/General/02_Initiatives/Modularization/2025%20Module%20Development/Business%20Capability/Business%20Capability%20Data%20Collection%20Template%20V1.0.xlsx?d=w23c39f73ad004bfda9b372638a17c50c&csf=1&web=1&e=8SMAMw)

**Note -** Check if customer has an existing business capability map. Decide with customer if the customer’s map should be used (depending on quality, completeness etc.). Otherwise use the industry business capability map from RBA. Recommendation is to use SAP RBA Business capability model)

Preparation Steps to be executed by SAP Enterprise Architect

## Typical Classifications for Business Capabilities

**Workshop: Baseline Preparation\***

| **Use Case** | **Classification** | **Description** | **Optional /Mandatory** |
| --- | --- | --- | --- |
| Service Scoping = Understand scope of capability mapping exercise | Scope  ( In scope, Out of Scope, To be decided) | In-scope of architecture work | Mandatory |
| Service Delivery = Actual capability heatmapping | Current Maturity | Maturity of Capability available in current business architecture | Optional |
|  | Target Maturity | Target Maturity of Capability in future business architecture | Optional |
|  | Business Value/Strategic Importance | Base/Competitive/Differentiator | Optional |
|  | Level of Customization | Low, Medium, High | Mandatory |
|  | Reason for Customization |  | Optional |
|  | Pain Point | Capability is a pain point today (e.g. capability is not available, capability is available but related processes inefficient etc.) | Mandatory |
|  | Opportunity | Opportunity areas. | Mandatory |
|  | Business Unit/ division | Capability is relevant for business unit A,B and C but not D. | Optional |
|  | Innovation Potential | Potential for modernizing SAP-driven processes using new technologies like AI, automation, or cloud capabilities related to the business capability | Mandatory |
|  | Standardization Potential | Determines the potential to leverage SAP standard (processes, applications etc) to address requirements of business capabilities. | Mandatory |
|  | Ownership | Global/Regional/ Local | Optional |
|  | Harmonization potential | Capture the Harmonization potential per capability | Optional |

Note – Please adjust the above list as per the customer requirements and also check the need for other modules in the delivery .

Sample

Step 1-Baseline Preparation

- Prepare first draft of business capability inventory in SAP LeanIX

**Workshop: Baseline Preparation\***

Step 1-Baseline Preparation

Preparation Steps to be executed by SAP Solution Archietct

Gather input for the business capability Map

- To gather the business capability attribute values, download the  business capabilities from SAP LeanIX along with all the classification attributes agreed with the customer using [template](https://sap.sharepoint.com/:x:/r/teams/TransformationHubCoreConfidential/Shared%20Documents/General/02_Initiatives/Modularization/2025%20Module%20Development/Business%20Capability/Business%20Capability%20Data%20Collection%20Template%20V1.0.xlsx?d=w23c39f73ad004bfda9b372638a17c50c&csf=1&web=1&e=8SMAMw)
- During the preparation workshops give a short walkthrough of the template to the customer and ask them to fill it offline for each Line of business.  Discuss the customer responses during the functional workshops.( In case customer also has access to the LeanIX tenant then use LeanIX collaboration feature and  ask the customer to directly update the Business capability fact sheets)
- Get  list of existing SAP/Non applications  in customer IT landscape ( with Software version, End of maintenance unit using application). Use [template](https://sap.sharepoint.com/:x:/r/teams/TransformationHubCoreConfidential/Shared%20Documents/General/02_Initiatives/Modularization/2025%20Module%20Development/Business%20Capability/Business%20Capability%20Data%20Collection%20Template%20V1.0.xlsx?d=w23c39f73ad004bfda9b372638a17c50c&csf=1&web=1&e=8SMAMw)

Build  Initial Business capability Map

- Update business capabilities factsheet - Classify the capabilities  as per the agreed criteria with customer.

- Update Business capability factsheet attributes  e.g.

  - Scope – In scope, Out of scope, To be decided
  - Classification- Opportunity, Pain point , Neutral
  - Maturity : Current Maturity and Target Maturity levels
  - strategic importance –Commodity, Innovation, Differentiation.
  - Lifecycle Status : Update the life cycle of capabilities

- Create  Capability Heatmap report  (refer [https://docs-eam.leanix.net/docs/reports](https://docs-eam.leanix.net/docs/reports))

  - Select a landscape  report type and click on “create Landscape report”
  - Give a name and select the Factsheet type as “Business Capability”.
  - Set up the filters as per your visualization requirement.
  - In the view  field “ select the attribute” for visualization

**1**

**2**

**3**

## Steps for Ex & Results Templates : Business capability Map in SAIX

**Prepare:**

- Map  Business capabilities to AS IS /TO BE applications

- For Product Maps use [Landscape](<(https:/docs-eam.leanix.net/docs/step-4-evaluate-your-target-architecture>) reports (Apps by Capability) or [Matrix](https://docs-eam.leanix.net/docs/matrix-report)

  - Use lifecycle view to generate AS IS and TO BE product Map

1

2

3

Step 1 –Build  Initial Product Map

- For Multiple Heatmaps  see Application Portfolio Assessment

**Workshop: Baseline Preparation\***

> Application landscape report. – Application life cycle.

**Preparation**

**Preparation**

**Preparation**

**Preparation**

**Preparation**

**Workshop: As-Is Review ( LOB specific)**

**Workshop: To-Be Review**

**( LOB  Specific)**

**Final Results**

**Preparation**

**Workshop: Baseline Preparation\***

\* Required by Functional Stream

## Business Capability – Delivery steps Overview

Step 1

Step 2

Step 3

Step 4

## Steps for Execution  : Business capability Map in SAP Lea

- Present prepared draft business capability mapping  and during the workshop  with customer review the below points for each business capability and get the clear understanding of each business capability  from AS IS and To Be perspective.

- Scope – In scope, Out of scope, To be decided,

- Classification - Opportunity, Pain point  ( Collect all the pain points/ opportunity areas  per business capability)

- Ownership – Global, Regional, Local

- Current Maturity / Target Maturity

  - Understand the gaps and what will it require to fulfill them in target state.

- Strategic Importance –Commodity, Innovation, Differentiation.

  - Understand the strategic importance and its relationship to the level of customization and innovation requirement.

- As IS and To BE Application map

- Level of Customization

- Standardization potential

- Innovation Potential – Understand the innovation requirements for each business capability

- Lifecycle Status

- Signavio Process insight report

**Workshop: As-Is Review ( LOB specific)**

Step 2- As Is Review workshops (LoB  specific))ates

Note- Its recommended to involve Business key stakeholders in the business capability workshops.

> Application landscape report. – Application life cycle.

## Step 2 - Update Business capability Map

**Prepare:**

- Update the Business capability classification attributes based on the customer feedback.

- In SAP Leanix update mapping of  business  Capabilities to the TO BE applications  (  Use Decision accelerators for reference)

- Generate reports for following artefacts

  - Business capability heatmaps
  - Product Map
  - Business footprint diagram

- For Product Maps use [Landscape](<(https:/docs-eam.leanix.net/docs/step-4-evaluate-your-target-architecture>) reports (Apps by Capability) or [Matrix](https://docs-eam.leanix.net/docs/matrix-report)

**Update Classification**

**Update Product Mapping**

**Generate Assessment Reports**

- **Business Footprint Diagram**

  - Diagram Type: Free Draw
  - Add Factsheets Organization and children as required by scope
  - Add for organization unit in scope the objectives
  - Add for objectives the related business capabilities
  - Add Applications

## Reports – Business Footprint Diagram

Step 2 - Update Business capability Map

**Update Classification**

**Update Product Mapping**

**Generate Assessment Reports**

**Preparation**

**Preparation**

**Preparation**

**Preparation**

**Preparation**

**Workshop: As-Is Review ( LOB specific)**

**Workshop: To-Be Review**

**( LOB  Specific)**

**Final Results**

**Preparation**

**Workshop: Baseline Preparation\***

\* Required by Functional Stream

## Business Capability – Delivery steps Overview

Step 1

Step 2

Step 3

Step 4

- Prepare the Business capability report for following heatmaps highlighting the key insights and recommendations

  - In Scope/Out of scope business capabilities ( Mandatory)
  - Pain points and opportunity areas ( Mandatory)
  - AS IS and TO BE Business capability map with AS IS and TO BE Maturity levels
  - Strategic Importance with the Customization levels ( as per customer case)
  - Innovation potential ( Mandatory)
  - Standardization potential ( Mandatory)

- Capture customer feedback and update business capabilities in SAP LeanIX for any changes.

## Step 3 - Workshop: To-Be Review

**Workshop: To-Be Review**

**( LOB  Specific)**

Business Footprint Diagram

A

Product Map

A

Business capability heatmap

A

**Preparation**

**Preparation**

**Preparation**

**Preparation**

**Preparation**

**Workshop: As-Is Review ( LOB specific)**

**Workshop: To-Be Review**

**( LOB  Specific)**

**Final Results**

**Preparation**

**Workshop: Baseline Preparation\***

\* Required by Functional Stream

## Business Capability – Delivery steps Overview

Step 1

Step 2

Step 3

Step 4

- For every line of business present final business capability assessment report to customer

## Step 5 – Present the results

**Results**

Business Footprint Diagram

A

Product Map

A

Business capability heatmap

A

## Thank you.

Transformation Hub

sap_transformation_hub@sap.com

## Color palette

Grey 2\
#EAECEE

Grey 11\
#12171C

Grey 10\
#1A2733

Grey 7\
#475E75

Grey 6\
#5B738B

Grey 4\
#A9B4BE

Blue 2\
#D1EFFF

Blue 11\
#00144A

Blue 10\
#002A86

Blue 7\
#0070F2

Blue 6\
#1B90FF

Blue 4\
#89D1FF

Teal 2\
#C2FCEE

Teal 11\
#012931

Teal 10\
#02414C

Teal 7\
#07838F

Teal 6\
#049F9A

Teal 4\
#2CE0BF

Green 2\
#EBF5CB

Green 11\
#0E2B16

Green 10\
#164323

Green 7\
#188918

Green 6\
#36A41D

Green 4\
#97DD40

Mango 2\
#FFF3B8

Mango 11\
#450B00

Mango 10\
#6D1900

Mango 7\
#C35500

Mango 6\
#E76500

Mango 4\
#FFC933

Red 2\
#FFD5EA

Red 11\
#350000

Red 10\
#5A0404

Red 7\
#D20A0A

Red 6\
#EE3939

Red 4\
#FF8CB2

Raspberry 2\
#FFDCE8

Raspberry 11\
#510136

Raspberry 10\
#71014B

Raspberry 7\
#DF1278

Raspberry 6\
#FA4F96

Raspberry 4\
#FEADC8

Pink 2\
#FFDCF3

Pink 11\
#28004A

Pink 10\
#510080

Pink 7\
#CC00DC

Pink 6\
#F31DED

Pink 4\
#FF8AF0

Indigo 2\
#E2D8FF

Indigo 11\
#0E0637

Indigo 10\
#1C0C6E

Indigo 7\
#5D36FF

Indigo 6\
#7858FF

Indigo 4\
#B894FF

## Baseline Preparation

**Prepare:**

- Review the Customer Strategy Map or the strategy map generated in Strategy module.
- Check if customer has business capability map. Decide with customer if the customer’s map should be used (depending on quality, completeness etc.). Otherwise use the industry business capability map from RBA content in SAP LeanIX (preferred).
- Based on the customer  industry download the  business capabilities from SAP LeanIX and add the classification attributes agreed with the customer. Use [template](https://sap.sharepoint.com/:x:/r/teams/TransformationHubCoreConfidential/Shared%20Documents/General/02_Initiatives/Modularization/2025%20Module%20Development/Business%20Capability/Business%20Capability%20Data%20Collection%20Template%20V1.0.xlsx?d=w23c39f73ad004bfda9b372638a17c50c&csf=1&web=1&e=8SMAMw) and share it with customer to collect additional information. During the preparation workshops give a short walkthrough of the template to the customer and ask them to fill it offline for each Line of business. Discuss the customer responses during the functional workshops.
- Based on our experience, [questionnaires](https://sap.sharepoint.com/:p:/r/teams/ArchitecturePlanningServices/Shared%20Documents/General/ArchitectureTransformation/10%20North%20Star%20Architecture/30%20-%20Scoping/NSA_Scoping_Questionnaire_LoB.pptx?d=w3b658e3efd204026a7fa00666fa19de3&csf=1&web=1&e=zYPLu2) sent out to customer before the workshop to collect information did not work well. Therefore, we typically rely on the other sources mentioned and the interviews.

**Workshop: Baseline Preparation\***

**Preparation**

**Preparation**

**Preparation**

**Preparation**

## Business Capability – Delivery steps Overview

**Preparation**

**Workshop: As-Is Review ( LOB specific)**

**Workshop: To-Be Review**

**( LOB  Specific)**

**Final Results**

**Preparation**

**Workshop: Baseline Preparation\***

\* Required by Functional Stream

Understand as-is capabilities and mapping of current applications to capabilities.

Collect To BE Strategy map

Agree on the Classification criteria and reports

Review baseline business capability map and application mapping in SAP LeanIX.

LoB specific deep-dive to better understand functional requirements.

Present the final Business Capability assessment results

Lob Specific- Review target business capability and application mapping.

During Scoping –

**During Service delivery**

a) Preparation EA/TL – based on the Initial scoping, customer AS IS architecture or based on the Industry capability model , Review Scope, Understand staregty map,AS IS business Capabilities L1/L2 with linkage to AS IS IT systems .Agree on the classification and reports ( Objective – Scope Clarity, Functional Experts required effort)

b) **DeepDives** – Discuss the Business capabilities in details and understand the customer requirement. Post session Expert should be able to derive AS IS and TO BE business capabilities, Pain points, Innovation areas,  AS IS and TO BE product mapping ( Before session – Customer AS IS Architecture, Process docs )

C) Review Results – TOBE capabilities

Understand  pain  points, opportunity areas and innovation needs

Review the Business capability assessment results

- Current Maturity vs Target Maturity
- Pain points and opportunity areas
- As IS and To BE business capability model
- Innovation Areas

Generate Assessment reports

- As IS and To BE Business capabilities
- As IS and To BE Product view
- Current Maturity Vs Target Maturity
- Pain points/Opportunity/

innovation area

Preparation Steps to be executed by SAP Enterprise Architect**.**

- Review the Customer Strategy Map or the strategy map generated in Strategy module.

- Check if customer has business capability map. Decide with customer if the customer’s map should be used (depending on quality, completeness etc.). Otherwise use the industry business capability map from RBA

- In SAP LeanIX, import business capabilities from best-practice, industry-specific business capability maps and customize them to suit your organization’s needs, Follow the steps as mentioned in [Reference Business Architecture ](https://docs-eam.leanix.net/docs/reference-business-architecture) ( Select industry maps as per your customer need, Administrator role is mandatory to perform these activities)

- Discuss and agree with the customer - scope of Business capabilities ( L1-L3)  for assessment ( 2-3 critical LOBs are recommended. Also note down any additional business capabilities to be added which are not part of the SAP standard RBA content in SAP LeanIX . If required, involve SAP Solution Expert for the workshop.

- Agree the business classification criteria with Customer ( check sample in next slide)

  - **Scope – In scope, Out of scope, To be decided, Opportunity, Pain point**
  - **Current Maturity / Target Maturity**
  - **Importance –Commodity, Innovation, Differentiation.**
  - **Lifecycle Status**

- For LeanIX, follow the steps as mentioned in [Reference Business Architecture ](https://docs-eam.leanix.net/docs/reference-business-architecture), Adjust the LeanIX metamodel and then  update the relevant business capability factsheet details.

- To gather the business capability attribute values, download the  business capabilities from SAP LeanIX with all the classification attributes agreed with the customer. Use [template](https://sap.sharepoint.com/:x:/r/teams/TransformationHubCoreConfidential/Shared%20Documents/General/02_Initiatives/Modularization/2025%20Module%20Development/Business%20Capability/Business%20Capability%20Data%20Collection%20Template%20V1.0.xlsx?d=w23c39f73ad004bfda9b372638a17c50c&csf=1&web=1&e=8SMAMw) and share it with customer to collect attribute information. During the preparation workshops give a short walkthrough of the template to the customer and ask them to fill it offline for each Line of business. Discuss the customer responses during the functional workshops.( In case customer also has access to the LeanIX tenant then use LeanIX Collaboration feature and  ask the customer to directly update the Business capability fact sheets)

- Get  list of existing SAP/Non applications  in customer IT landscape ( with Software version, End of maintenance unit using application). Use [template](https://sap.sharepoint.com/:x:/r/teams/TransformationHubCoreConfidential/Shared%20Documents/General/02_Initiatives/Modularization/2025%20Module%20Development/Business%20Capability/Business%20Capability%20Data%20Collection%20Template%20V1.0.xlsx?d=w23c39f73ad004bfda9b372638a17c50c&csf=1&web=1&e=8SMAMw)

**Workshop: Baseline Preparation\***

Step 1-Baseline Preparation

Preparation Steps to be executed by SAP Solution Expert

- Review the Customer Strategy Map or the strategy map generated in Strategy module.

- Along with SAP Enterprise Architect ,discuss and agree with the customer - scope of Business capabilities ( L1-L3)  for assessment ( 2-3 critical LOBs are recommended. Also note down any additional business capabilities to be added which are not part of the SAP standard RBA content in SAP LeanIX

- Get  list of existing SAP/Non applications  in customer IT landscape ( with Software version, End of maintenance unit using application). Use [template](https://sap.sharepoint.com/:x:/r/teams/TransformationHubCoreConfidential/Shared%20Documents/General/02_Initiatives/Modularization/2025%20Module%20Development/Business%20Capability/Business%20Capability%20Data%20Collection%20Template%20V1.0.xlsx?d=w23c39f73ad004bfda9b372638a17c50c&csf=1&web=1&e=8SMAMw)

- For LeanIX, follow the steps as mentioned in [Reference Business Architecture ](https://docs-eam.leanix.net/docs/reference-business-architecture), update the relevant business capability factsheet details per solution area.

- In case customer SAP Signavio process insights results are available   then assess the AI potential of business capabilities,

- Define  Applications ( AS IS/TO BE) - Define the application inventory –in SAP Leanix by using fact sheet type as “Application”  with proper maintenance of below fields

  - Lifecycle
  - Business Criticality
  - TIME (Tolerate, Invest, Migrate, Eliminate)

- Map AS IS and TO be applications to the business capabilities.

**Workshop: Baseline Preparation\***

Step 1-Baseline Preparation

- Review the Customer Strategy Map or the strategy map generated in Strategy module.

- Discuss and agree with the customer - scope of Business capabilities ( L1-L3)  for assessment ( 2-3 critical LOBs are recommended)

- Check if customer has business capability map. Decide with customer if the customer’s map should be used (depending on quality, completeness etc.). Otherwise use the industry business capability map from RBA

- Agree the business classification criteria with Customer

  - **Scope – In scope, Out of scope, To be decided, Opportunity, Pain point**
  - **Current Maturity / Target Maturity**
  - **Importance –Commodity, Innovation, Differentiation.**
  - **Lifecycle Status**

- In case customer SAP Signavio process insights results are available   then assess the AI potential of business capabilities,

- Get  list of existing SAP/Non applications  in customer IT landscape ( with Software version, End of maintenance unit using application)

- Import business capabilities from best-practice, industry-specific business capability maps and customize them to suit your organization’s needs, Follow the steps as mentioned in [Reference Business Architecture ](https://docs-eam.leanix.net/docs/reference-business-architecture) ( Select industry maps as per your customer need, Administrator role is mandatory to perform these activities)

- Define  Applications ( AS IS/TO BE) - Define the application inventory –in SAP Leanix by using fact sheet type as “Application”  with proper maintenance of below fields

  - Lifecycle
  - Business Criticality
  - TIME (Tolerate, Invest, Migrate, Eliminate)

**Workshop: Baseline Preparation\***

Step 1-Baseline Preparation
