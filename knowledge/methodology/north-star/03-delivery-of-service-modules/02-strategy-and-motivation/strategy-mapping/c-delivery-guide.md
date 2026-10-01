## Delivery Guide

## Module LeanIX Setup

## LeanIX for Strategy Meta Model

**Business Capabilities**

**Applications**

**Initiatives**

supports

improves

**Objectives**

supports

- **Description**
- Usage of standard fact sheet types in LeanIX
- Hierarchy for Objectives to follow SAP EAM definitions.
- Reports will be provided via extension as soon as the extension framework will eb available in LeanIX (planned for end of Q1)

**Organization**

improves

owns

owns

**Strategic Priority**

**Goal**

**Objective (Value Driver)**

Attribute Value contribution

- It’s advised to use the standard meta model from LeanIX for strategy mapping and to only use the objective factsheet type for strategic priorities, goals, and objectives/value drivers.
- Therefore, we recommend to create three subtypes in LeanIX for the factsheet type objective.

## LeanIX Setup – Meta Model – Fact Sheet Type

1. Go to *Administration*  *Meta Model Configuration*

2. Select Fact Sheet *Objective*

3. Select *Objective with all Subtypes*

4. Select *Create Subtype*

5. Create the following subtypes:

   - Strategic Priority
   - Goal
   - Objective (Value Driver)

6\. Recommended Colors:

- Strategic Priority (#751a3b)
- Goal (#c7527d)
- Objective (#f8a1c1)

## LeanIX Setup – Meta Model – Subsection Architecture Impact

1. Go to *Administration*  *Meta Model Configuration*

2. Select Fact Sheet *Objective*

3. Add to *Planning* the subsection *Architecture Impact*

4. Add to the same subsection the field *Architecture Relevance* with values:

   - *High*: Objectives that reshape the enterprise architecture fundamentally, affecting multiple domains (business, application, data, technology).
   - *Medium*: Objectives that alter key components of the architecture but within the boundaries of existing structures.
   - *Low*: Objectives that have minimal or localized architectural impact, typically confined to a single system or department.

5\. Recommended Colors:

- High (#9755cd)
- Medium  (#00A399)
- Low  (#AAB8CD)

## LeanIX Setup – Meta Model – Relational Attribute Value Contribution

1. Go to *Administration*  *Meta Model Configuration*

2. Select Fact Sheet *Business Capability*

3. Add in Demand Management under Objectives the relational attribute Value Contribution with the following values:

   - *High: Essential to achieving the objective; strong, direct impact.*
   - *Medium: Supports the objective; noticeable but not decisive impact*
   - *Low: Marginal relevance; little or no impact on the objective.*

*4.* Recommended colors:

- Low (#ffe093)
- Medium (#ffd05d)
- High (#f0ab00)

- Create as preparation the organizational structure as of the scoping (business divisions, regions etc.)
- The organization map should have been created during the overall scoping of the North Star. Take this as input and model the organizational scope relevant for the strategy mapping in LeanIX.

## LeanIX Setup – Organizations

1. Inventory

2. Select *New Fact Sheet*

3. Type name of the organization

4. Fact Sheet Type *Organization*

5. Select appropriate subtype (legal entity, business unit, region etc.).

6. Create relationship between the organizational elements (Parent-Child)

7. Check results by creating report:

   - Report type: landscape
   - Base factsheet type: organization

- **Strategy Map Report**

  - report type *landscape*
  - Base fact sheet type: *objective*

## LeanIX Setup – Reports – Strategy Map Report

- **Strategy Map to Business Capabilities**

  - report type *landscape*
  - Base fact sheet type: *business capability*
  - Cluster by: *improved by objectives*

## LeanIX Setup – Reports – Strategy Map to Business Capabilities

- **Business Capabilities to Products**

  - report type *landscape*
  - Base fact sheet type: *application*
  - Cluster by: *business capabilities*

## LeanIX Setup – Reports – Business Capabilities to Products

- **Strategy Map to Initiatives**

  - report type *landscape*
  - Base fact sheet type: *initiative*
  - Cluster by: *supports objectives*

## LeanIX Setup – Reports – Strategy Map to Initiatives

- **Business Footprint Diagram**

  - Report type: matrix
  - Select base fact sheet type: business capability

## LeanIX Setup – Reports – Business Footprint Diagram

## Module Delivery Steps

1. Introduce customers to strategy mapping approach: leverage the positioning guide to explain what strategy mapping and the delivery approach (in case not all customer stakeholders have yet been introduced to the approach).
2. Present (show&tell) to the customer how LeanIX will be used and what reports are leveraged in LeanIX
3. Customer needs to present based on the scope the current strategy and initiatives. Ask customer to share documents related to the strategy after the workshop. In case this is not possible, perform short interviews as needed and document interview results in the [MURAL](https://app.mural.co/t/services0169/m/services0169/1709804128941/aabd96f82a90802bd68eda8234c4eabb2e53c52a). Interviews should be considered as additional effort during the scoping.
4. Review with customer the workshop plan and make adjustments where necessary.

## Step 1: Baseline Preparation

**Baseline Preparation**

1. After the initial workshop, model the strategy map in LeanIX as a preparation for the strategy mapping workshop:

   - Create fact sheets for strategic priorities, goals, and objectives based on customer documents
   - Create relations between the factsheets (Dependency: *supporting objectives*)
   - Creation relations between objectives and the organizational unit (*Owned by organization*)
   - Classify the objectives according to their architecture impact. Focus in the following on those objectives that have high impact on the architecture discussion.

2. Present to customer initial version of the strategy map in the scheduled workshop.

3. Discuss necessary adjustment and model it in LeanIX

Hints:

- You can leverage also the LeanIX industry starter kits as they also include strategy maps by industry (SAP’s perspective). Nevertheless, strategy mapping should be focused on customer’s strategy. The industry kits can however give a first inspiration.
- On objective level, SAP’s value drivers can be leveraged. Currently, they are available in Solaris and can be consumed with SAP PMG. You can download and import them to LeanIX as well (manual activity). In future, they will be part of RBA/RSA content and likely also available in LeanIX. At the moment, linking value drivers to business capabilities in RBA will still require some workarounds and manual effort.
- GenAI can help to generate a strategy map based on customer input. It can also be leveraged to create linkages to business capabilities. We are working also on a tool based on GenAI to scale this approach.

## Step 2: Strategy Mapping

**Strategy Mapping**

## Strategy Map

Derive strategic priorities, goals, and objectives and cluster it into a strategy map.

1

Evaluate what objectives are relevant to the architecture planning activities.

2

1. After the strategy mapping workshop, model the business capability and product map in LeanIX as a preparation for the next workshop:

   - Create relations between objectives and business capabilities (Planning: *Improves Business Capabilities*)
   - Create relations between business capabilities and applications (Demand Management: *Applications*)
   - Flag applications as opportunities if customer does not yet have planned to introduce the application or is not yet decided.
   - Creation relations between business capabilities/applications and the organizational unit.
   - Optional: evaluate business capabilities maturity

2. Present to customer initial version of the mapping in the workshop.

3. Discuss necessary adjustment and model it in LeanIX

## Step 3: Business Capability and Product Mapping

**Business Capability & Product Mapping**

## Business Capability Map

Map to the objectives the business capabilities.

3

Classify the business capabilities to the current maturity.

4

## Product Map

Map applications (as-is and potential to-be) to the capabilities identified as relevant to the strategy.

5

1. Model the initiatives and the mapping to objectives in LeanIX as a preparation for the next workshop:

   - Create relations between initiatives and objectives (Initiative Environment: *Affected Objectives*)
   - Creation relations between initiatives and the organizational unit (*Affected organizations*)

2. Present to customer initial version of the mapping in the workshop.

3. Discuss necessary adjustment and model it in LeanIX

## Step 4: Initiatives Mapping

**Initiatives Mapping**

## Initiatives mapped to Strategy

Map initiatives from customer to objectives from the strategy map.

6

1. Before review workshop, check again the LeanIX reports and necessary adjustments.

2. Optional: create a dashboard in LeanIX for the customer presentation

3. Review with customer the results and make last adjustments to the following produced artifacts:

   - Strategy Map
   - Business Capability Map (as a mapping of strategy map to business capabilities)
   - Product Map (as a mapping of business capabilities to products)
   - Initiatives catalogue (as a mapping of initiatives to objectives)
   - Business Footprint Diagram

4. Sign-off deliverables with customer

## Step 5: Review

**Review Strategy Map**

## Business Footprint Diagram

Build the business footprint diagram by linking the organizational units with objectives, business capabilities, and applications.

7

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
