## SAP S/4HANA Breakdown in Modules  RBA RSA 2507

## SAP Enterprise Reference Architecture at a glance

Methodology

**SAP Enterprise Architecture Methodology** (based on               )

Business Capability Model

Business Process Model

Solution Capability Model

Solution Process Model

Business Data Model

Content

Solution Data Model

**SAP Reference Business Architecture (RBA)**

**SAP Reference Solution Architecture (RSA)**

Specific E2E Processes for 20 Industries

Business Value Flow Diagrams

Unified Business Domains, -Areas & -Capabilities

Solution Capability Maps

Solution Value Flow Diagrams

Solution Process Flow Diagrams (BPMN)

Solution Data Flow Diagrams

A screenshot of a computer screen  Description automatically generated

A screenshot of a computer  Description automatically generated

Business Processes\

Process Scoping\

Transformation

Business Capabilities\

Recommended SAP Solutions\

Transformation

Consumption

Integration

**2504 release focus**

## Today’s Challenge in mapping the SAP Business Capability Model

I am an Enterprise Architect and currently run a **Business Capability Assessment** with my client. Naturally, a lot of Business Capabilities are covered by **SAP S/4HANA** – so the (factsheet type) Application “SAP S/4HANA” is used almost everywhere. For my client, this information is not sufficient. He/she wants to **dig deeper** and learn which module within SAP S/4HANA is relevant to enable the respective Business Capability.

How can you help me?

**Don’t worry – we have got you covered! Check out this Demo, to learn first hand**

- While many organizations recognize SAP S/4HANA as a key solution in their business transformation, pinpointing relevant modules within it is important to detail out transformation efforts effectively. That's where a **consistent module representation of SAP S/4HANA within the SAP Reference Architecture** comes into play.
- When mapping SAP Business Capabilities to the respective SAP Application, it will not stop at S/4HANA on Application level – instead users will be able to see the respective SAP S/4HANA Module required to achieve a specific Business Capability.
- A **taxonomy of SAP S/4HANA modules** for the SAP Business Capabilities Model has been created, which will be represented in SAP LeanIX and SAP Signavio Process Explorer moving forward.

## SAP S/4HANA Module Representation in Enterprise Architecture Models

**Scenarios**

The SAP S/4HANA module detail in SAP Reference Architecture is integral for various **use cases** at the application level, including:

- owner identification
- successor planning
- migration scenarios

Lights On with solid fill

- managing interfaces
- overseeing licenses

- In the RBA/RSA Enterprise Architecture Models the Solution Components in the SAP S/4HANA context will be represented by the usage of a **2-level hierarchy:**

## How to Consume the S/4HANA Module Representation

Level 1\
**Solution Sub Component**

**Solution Sub Component** level 1 leverage the RBA Business Domain following the SAP LeanIX Best Practice

- For practical reasons, the additional L1 “Cross Functionality” is introduced; they are centrally defined to be used by many other business functions such as Master Data Management or Pricing
- This level does not reflect the technical structure within S/4HANA

Level 2\
**Solution Sub Component** (**Module)**

Modules are sub-group in Solution Sub Components; they represent the technical structure of SAP S/4HANA

- A module represents a group of solution capabilities technically belonging together and might be subject to additional pricing
- Modules need to be mapped to an element of the Application Component Hierarchy (ACH)
- Modules are in a 1:1 relation to ACH elements

What is the ACH?

- Application components are elements of the SAP back-end system that contain a set of area-specific or cross-functional business processes. These components are structured in the application component hierarchy (ACH).
- The ACH is a tree-structure, arranging components by products and functions. These are ordered by a business view as opposed to a technical view. This ordering allows to identify components that are thematically related.

## Taking a Closer Look at the Application Component Hierarchy (ACH)

Customer Messages

SAP Notes structuring

Customizing

SAPTerm

ACH

…

Why is the ACH important? \
Generally, the structure of the ACH tree allows other functions and features to dock on and to enrich the structure with custom data. This data can then be used for communication and to feed other features and functionality.

> What is the ACH?\
> The ACH is a tree-structure of components arranged by products and functions. These are ordered by a business view as opposed to a technical view. This ordering allows you to identify components that are thematically related.
>
> Why is the ACH important? \
> Generally, the structure of the ACH tree allows other functions and features to dock on and to enrich the structure with custom data. This data can then be used for communication and to feed other features and functionality.
>
> Exemplary use cases that are made possible by ACH:
>
> - localize your applications by translating texts in different languages (Terminology in SAPTerm)
> - handle any Test-Management
> - handle responsibilities and ownership for code

## Visualization of S/4HANA Module Representation in SAP Reference Architecture

SAP S/4HANA Cloud \
Public Edition

S/4HANA

SAP S/4HANA Cloud \
Private Edition

Finance

**Solution Component**

**Solution Sub Component**

**Level 1**

**Solution Sub Component**

**Level 2 (Module)**

Manufacturing

…

Accounts Payable             (FI-AP)

Accounts Receivable.       (FI-AR)

Asset Accounting       (FI-AA)

…

Production Planning and Detailed Scheduling             (SCM-APO-PPS)

Production Planning and Control (PP)

…

Finance

Manufacturing

…

Accounts Payable

(FI-AP)

Accounts Receivable

(FI-AR)

Asset Accounting

(FI-AA)

…

Production Planning and Detailed Scheduling             (SCM-APO-PPS)

Production Planning and Control (PP)

Production Engineering and Operations    (PP-PEO)

…

…

Finance

Manufacturing

…

Accounts Payable              (FI-AP)

Accounts Receivable         (FI-AR)

Asset Accounting         (FI-AA)

…

Production Planning and Detailed Scheduling (SCM_APO-PPS)

Production Planning and Control

Production Engineering and Operations      (PP-PEO)

…

…

## Visualization of S/4HANA Module Representation in SAP Reference Architecture

SAP S/4HANA Cloud \
Public Edition

**Solution Component**

**Solution Sub Component**

**Level 1**

**(15)**

Finance

Human Resources

International Trade and Global Tax

Cross Functionality

Customer Service

Supply Chain

Sustainability Management

Manufacturing

Portfolio and Project Management

Governance, Risk and Compliance

Product Management

R&D Engineering

Sales

Service Delivery

Sourcing and Procurement

## The Roadmap to S/4HANA Module Representation

Defining the taxonomy of \
SAP S/4HANA modules

Implementing Level 2 Solution Sub Component (Module) Structure in MXP

Mapping Solution Capabilities to Level 2 Solution Sub Component (Module)

Published (2504) Solution Capabilities \
to Level 1 and 2 Solution Sub Component

Implementing Level 1 Solution Sub Component Structure in MXP

Solution Capabilities to Level 1 and 2 Solution Sub Component in\
SAP LeanIX and \
SAP Signavio Process Explorer

Done	Next

## Questions or Feedback?

**Sreelatha N, Mark Ross**\
Enterprise Architects, SAP Global Content Group\
[sreelatha.n@sap.com ](mailto:sreelatha.n@sap.com), [Mark.Ross01@sap.com](mailto:Mark.Ross01@sap.com)

**Julia Meyer**\
EA Enablement\
[Julia.Dorothee.Meyer@sap.com](mailto:Julia.Dorothee.Meyer@sap.com)

**Nadine Cordes**\
Enablement & Communities\
[Nadine.Cordes@sap.com](mailto:Nadine.Cordes@sap.com)
