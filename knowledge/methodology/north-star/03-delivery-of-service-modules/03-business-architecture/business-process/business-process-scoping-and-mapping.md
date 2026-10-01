Speaker’s Name, SAP

Month 00, 2021

## Module – Business Process Scoping and Mapping

1. Module 1-pager
2. Business Process Mapping
3. Examples

## Module Content

**BUSINESS PROCESS SCOPING**

- Define the scope for the exercise, e.g. entire organization, certain business(es), certain function(s)
- classification criteria builds the heatmap view
- Build multiple heatmaps to illustrate various points of view to emphasis set problem or topic – don’t go just with one “view”

- The creation of a process map is done by engaging the stakeholders. Effort depends on number of businesses and organizations and functions addressed
- Use of the SAP Product Map Generator is recommended with content Reference Business Architecture.

**Business Process Scoping & Mapping –** UNDERSTANDING CUSTOMER’S OPERATING MODEL

**Modeling guidelines**

**Method**

**Main Steps**

The **business process scoping and mapping** depicts what business processes are in scope for the architecture design. In addition, based on predefined criteria and optionally by leveraging BPI Process Insights, a process heatmap can be established.

- The SAP Reference Business Architecture provides content for end-to-end business processes and process variants.

Identify what **end-to-end business processes** are in scope like:

- Idea-to-Market
- Plan-to-Produce
- Recruit-to-Retire
- Record-to-Report

Etc.

**1**

Leverage **BPI** (Process Insights and Process Intelligence) to identify critical processes (optional)

**4**

For selected E2E business processes, further **narrow down the scope** by identifying modular business processes, process segments, process activities and capabilities.

**2**

**Classify** business processes according to the defined classification criteria.

**3**

**Hints and tips**

Create **business process  heatmap** based on criticality and classification.

**5**

A Business Process is a sequence of value-generating business activities, which reflect a specific business practice and can be implemented by enterprises to generate a specific outcome. A Business Process reflects an implementable and executable process and is typically composed of elements from one or multiple generic E2E Processes.

Visualize business processes\
Visualize relevant business process levels as required

Breakdown of business model\
Breakdown of business process models into business process modules (L2), segments (L3) and activities (L4)

**Business Architecture – Business Process**

Map relevant value flows\
Map value flows for the relevant business models. Amend / adjust where required.

## SAP Business Process Model – Generic E2E Business Processes

> A **set of eight Generic E2E Business Process** describe the value creation of an enterprise in a generic, standardized way. These generic processes provide the foundation and building blocks for standardized business process modelling and cover the essential value generating processes of an enterprise. The Generic Business Processes can be considered as a construction manual and template for standardized business process modelling.

## Business Architecture – Business Process

> **Business Processes are typically structured along 4 levels:**
>
> Level 1: A **Business Process** is composed of multiple Business Process Modules. A Generic E2E Business Process covers all aspects of a so-called PCDA cycle (plan/do/check/act) and also includes pervasive ‘management’ activities that don’t fit within a specific process sequence. They therefore start with a module ‘ Plan to Optimize…’, followed by modules covering the execution (or action), and end with a process module ‘Manage …’ for pervasive management type activities.
>
> Level 2: Business process segments are combined to **Business Process Modules**. The name of a business process module follows the nomenclature \<A to B> with A representing the starting point of the process and B representing the end point of the process. Exception are process modules titled as \<Manage ..> as these contain activities which are pervasive and not typically sequenced along a process.
>
> Level 3: Business activities are composed into **Business Process Segments**. The name of a business process segment usually corresponds to a Business Area in the Business Capability Model (note: we used same name to create synergy between the two models but they are different objects).
>
> Level 4: The lowest level 4 represents the **Business Activity** (value creating step). All business activities are defined in ONE central **Business Activity Repository.**
>
> The BPM is based on the Process Classification Framework (PCF) [version 7.2.1](https://sap.sharepoint.com/:x:/r/teams/EAF/Shared%20Documents/Website%20Content/Other%20Materials/APQC/CrossIndustry_v721_vs_v611.xlsx?web=1) from American Productivity and Quality Center ([APQC](https://www.apqc.org/)).
>
> APQC offers many industry specific variants of their PCF. However, our current BPM is industry-agnostic but incorporates different industry practices already. Over time more industry flavor will be added to cover all industries but also customers who cross multiple industry boundaries and require practices from different industries.
>
> You find the APQC reference in our Business Process Models on the Business Activity level.

## Background: RBA and TOGAF alignment

**TOGAF**

**SAP Reference Business Architecture**

Business Process Module

Business Process Segment

Business Activity

Business Capability

Business Process

Processs Variant

Translation

RBA

TOGAF

Capability

Capability

Business Activity

Value Stage

Process Variant, Module, & Segments

Value Stream

## Based on RBA reference content we can use business processes and capabilities at the same time

Start Scoping based on Business Processes

When to use?

- Depict value flow across systems/landscapes
- Integration view important
- Process re-design goal of transformation
- Process variants by sector/division/unit
- process automation and BPI

Business Capability Heatmap

Business Process Heatmap

When to use?

- Linking to corporate strategy (strategy map)
- Counterparts rather on an IT side
- Compare “systems” (M&A, landscape transformation…)

Not an EITHER/OR but an AND

## Breakdown Business Process Models

Identify the relevant business processes, business process modules, business process segments and business activities by leveraging the SAP Business Reference Content

- Identify the Business Processes Variants (L1)
- Identify relevant Business Process Modules (L2)
- Identify relevant Business Process Segments (L3)
- Identify relevant Business Activities (L4)
- Cross-check relevant levels for completeness

Breakdown of business process model\
Breakdown of business process models into business process modules (L2), segments (L3) and activities (L4)

> With the help of the Business Reference Architecture the «navigation» between different levels of the Business Process Model is easily achieved. Aim is not to define and outline a holistic business process model but rather concentrate on the processes relevant for the archietcture work.

## Main Steps

**Step 1**: Select in-scope Business Processes

**Step 2**: Select in-scope Process variants

PMG Views:

Classification:

- Select in-scope/out-of-scope processes and variants
- Classify processes and variants according to different criteria (see next slide)

## Main Steps

**Step 3**: Review Business Process Modules, Business Process Segments and Business Activities and Capabilities

PMG Views:

Business Process Module

Business Process Segment

Business Activity

Business Capability

Classification:

- Select in-scope/out-of-scope modules, segments and activities
- Classify modules, segments, activities according to different criteria (see next slide)

## Main Steps

**Step 4**: Review Business Capability Map

PMG Views:

For more details on business capability heatmapping and assessment check the corresponding module

## Typical Classifications for Business Processes*

| Use Case | Classification | Description |
| --- | --- | --- |
| **Service Scoping** = Understand scope of process mapping exercise | In-scope | In-scope of architecture work |
|  | Out-of-scope | Out-of-scope for service, i.e. processes will not be discussed as part of architecture work |
|  |  |  |
| **Service Delivery** = Actual process heatmapping | As-Is | Process available in current business architecture |
|  | To-Be | Process part of future business architecture |
|  | To-be-decided | Not yet clear if process is needed |
|  |  |  |
|  | Pain Point | Process is a pain point today (e.g. process is not available, process is available but inefficient etc.) |
|  | Priority | Priority of process for business is low-medium-high-critical |
|  | Business Unit | Process is relevant for business unit A,B and C but not D. |

\*Classification on RBA content can be done on different levels:

- Business Processes and Variants
- Business Process Modules
- Business Process Segments
- Business Activities

## Accelerators

**SAP Product Map Generator**

[☞ Documentation ☜](https://teams.microsoft.com/l/channel/19%3A727ffbd6ada14fe8b9b77a693e65b4dd%40thread.tacv2/tab%3A%3Aeefcdcba-18ae-486b-b0ce-baf2ade4412b?groupId=ecadcbf5-0ab4-43a4-9b47-efec73de8149&tenantId=42f7676c-f455-423c-82f6-dc2d99791af7&allowXTenantAccess=false)

- Recommended tool for process mapping
- Reference content can be imported
- Provides standard views for most use cases
- Highly configurable for individual needs

**Content**

**RBA**: [RBA/RSA Overview](https://sap.sharepoint.com/teams/EAF/SitePages/RBAoverview.aspx)

- SAP reference process model
- Not yet industry specific (planned)
- Content can be downloaded from PMG server and imported into a PMG model

## Planning Capabilities– Coverage by Applications

| **Reference Process #** | 4.5 Kitting | 4.7 Plan and manage distribution | 4.7 Plan and manage distribution<br>6.12.1.5 Plan parts distribution | 6.11 Manage parts<br>6.12.1.4 Plan parts supply | 6.12.1.2 Plan parts inventory | 6.12.1.4 Plan parts supply | 6.12.1.8 Monitor parts |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **MB Current Business Capabilities & Solution Capabilities** |  |  |  |  |  |  |  |
| **AS IS Business Capability** | • Kitting & Packaging | • Distribution Requirements Planning | • Deployment<br>• Inventory Balancing | • Inventory Planning (SiB, EOQ, Stocking, Destocking) | • Capture demand history<br>• Manage demand history<br>• Forecasting | • Phase In / Phase Out | • Tracking & Tracing<br>• Supply Chain Exception Handling |
| **AS IS Solution Capability** | • SCM SPP<br>• ECC<br>• WMS | • SCM SPP<br>• ECC<br>• WMS / EWM | • SCM SPP<br>• ECC<br>• WMS / EWM | • SCM SPP<br>• ECC | SCM SPP |  |  |
| **TO BE Business Capability** |  |  |  |  |  |  |  |
| **SAP Business Capability** | Kitting & Packaging | Distribution Requirements Planning | • Deployment<br>• Inventory Balancing | • Global Stock Visibility<br>• Inventory Optimization<br>• Inventory Planning (SiB, EOQ, Stocking, Destocking) | Capture demand history<br>Manage demand history<br>Forecasting | Product Launch & Phase-out management and Final Stockpiling | • Tracking & Tracing<br>• Supply Chain Exception Handling |
| **TO BE Solution Capability** |  |  |  |  |  |  |  |
| **S/4 HANA eSPP** |  |  |  |  |  |  |  |
| **S/4 HANA Core** |  |  |  |  |  |  |  |
| **SAP Analytics Cloud** |  |  |  |  |  |  |  |
| **SAP IBP** |  |  |  |  |  |  |  |
| **S/4 HANA EWM** |  |  |  |  |  |  |  |
| **Logistics Business Network** |  |  |  |  |  |  |  |

Critical Core Component

Optional Component

Chart legend:

Subsequent Process
