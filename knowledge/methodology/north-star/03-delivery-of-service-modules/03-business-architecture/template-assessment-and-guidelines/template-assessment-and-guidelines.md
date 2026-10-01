## Template Assessment & Guidelines Complete Guide – Positioning to Delivery

Transformation Hub , SAP

March, 2024

## Module Introduction

## Motivation

The purpose of the Template Assessment & Guidelines module is to assist organizations determine their requirement for the use of a Template to drive their need for a standardized operating model.

**Understand Strategy**

Gather the strategic priorities of your company and your organization.

**Determine Template Requirements**\
Identify the broad scope of the template based assessing priorities, constrains and value.

**Understand Template Drivers**\
Understand the impact of the standardization requirement on the target landscape

- Help translate standardization aspects of business strategy into the scope of an SAP operating template covering business processes and data models.
- Determine the artefacts that will be required for the template, allowing for planning on template build and roadmap.

**Benefits**

## Template Assessment and guidelines

**Module Overview**

The purpose of this module is to assess/design the Global Template strategy for a customer. Determine the needs and benefits that will drive such a strategy and identify the key building blocks that can be used to operationalize the strategy.

- Strategy Input (required)
- Strategy assessment (optional)

- Capabilities classification and prioritization (optional)
- Target application architecture (optional)

**Prerequisites**

- Template drivers, template definition and how to set up the governance
- How to build and rollout a template
- Template impact on deployment options, future landscape.

**Benefits**

- Business Strategy to Template Strategy Derivation
- Template Drivers, scoring and evaluation
- Template Priorities, Constraints and Benefits
- Template Implementation Roadmap
- Template build plan with the depth agreed with the customer (use SAP Activate)

**Deliverables**

- Target Application Architecture (Optional)

**Successor Modules/ Next Steps**

**Main Steps**

- Understand and contextualize customer strategy
- Understand and contextualize customer template requirements

**1**

Document customer priorities and constraints

**4**

- Assess target landscape if available
- Translate customer strategy and target landscape into roadmap drivers

**2**

Build and score template requirement/maturity assessment.

**3**

Create a high level build and implementation roadmap with timelines.

.

**5**

**Effort & Effort drivers**

- Number  of Business Target Operating Models
- Template Maturity at customer (no template means Core)
- Landscape Complexity

Informal: 2 - 4 hrs.

Light :     2 - 4 days

Core :     6 – 10 days.

> How to define the Efforts as per the depth level for this module as it will mainly depend on the business Processes in scope. How to consider the scope based on the Business Processes.

## Template – Definition of Terms (1/2)

- An SAP template is a definition of how business processes and data models will be configured in SAP to support a specified business scenario specific operating model. The following artefacts are defined to support preconfigured processes and data in the template definition.

  - Process Definition

  - Data Architecture

  - Application Architecture

  - Governance

  - Implementation Artefacts

    - Organization Unit Definitions
    - Process Blueprints
    - Configuration Guides
    - Master Data Definitions
    - Standardized list of custom developments
    - Roles and Authorizations
    - Test strategy and scenarios
    - Training Material

- The smallest SAP unit for which a template is normally applied is the Company Code.

- SAP templates are designed to streamline the implementation process, reduce costs, and improve consistency and accuracy across the organization.

## Template – Definition of Terms (2/2)

Global Template

Template definitions that apply across the entire organization without boundaries.

Regulatory

Statutory

Business Critical

Country specific laws that apply to the company.

Non regulatory agreements such as with unions or other bodies.

Variations that are critical for doing business in a particular entity, to remain competitive or to align with local business practices.

The definition of a template includes the global template as well as the localization scope.

## Template Types

**Template System**

**USA**

**Europea**

**Asia**

**Full template**

- Covers *all* business processes
- Complete template is developed first
- Local specifics do not exist

**Template System**

**USA**

**Europe**

**Asia**

**Partial template**

- Covers only global processes
- Only common global parts of the template are developed first
- Local specifics are developed within each entity

**Template System**

**USA**

**Europea**

**Asia**

**Template System**

**USA**

**Europe**

**Asia**

T1+Δ(T1T2)+Δ(T2T3)

T2+Δ(T2T3)

T3

ΔT2T3

T1

T1

ΔT1T2

ΔT2T3

T2

ΔT2T3

ΔT1T2

**Pilot & Rollback**

- Covers only processes of the first entity in the beginning
- Pilot becomes template system
- Following entities have to redo some parts

**Iterative template**

- Covers only processes of the first entity in the beginning
- Template is adapted and enhanced each time
- All entities have to re-do some parts

## Instance and Related Terms

- An SAP **Instance** is a single, self-contained installation of the SAP system that runs on a separate set of hardware resources. It is an independent entity that comprises one or more SAP processes, such as application servers, message servers, and dispatchers, that work together to provide specific SAP services. Multiple templates can co-exist in one instance subject to the required template governance.
- Each SAP instance has its own system ID (SID) and a unique set of configuration and data files, which are stored in a separate file system. Multiple SAP instances can be run on a single physical server, and each instance can have its own database, but they share the same hardware resources, such as CPU, memory, and disk space. An SAP instance is sometimes referred to as a ‘**System**’ in common usage.
- SAP instances are typically used to separate different SAP environments, such as development, testing, and production, to prevent conflicts between them and to provide better control over system performance, availability, and security.
- Multiple instances can be installed on the same **machine**, **server** or **host** as the terms are often used interchangeably.
- The IT **Landscape** consists of all the IT systems that are related to a particular objective, such as supporting the operations of the business.

## Template Landscape Options

Online meeting with solid fill

Checklist with solid fill

Plugged Unplugged with solid fill

**Single Instance**

- The organization uses a single global instance where one or multiple templates are implemented.

- This leads to the following impacts.

  - Template Governance is easier to manage.
  - CTS landscape can be simpler.
  - Regression testing scope can be complicated.

Online meeting with solid fill

Checklist with solid fill

Plugged Unplugged with solid fill

**Multiple Instances**

- The organization uses multiple instances based on region or other criteria. One or multiple templates may be implemented on each instance.

- This leads to the following impacts.

  - Template Governance is more complex to manage.
  - CTS landscape will be more complex.
  - Regression testing scope can be simpler.

Online meeting with solid fill

Online meeting with solid fill

A Template need not therefore be equivalent to an instance as multiple templates may be implemented on an instance.

## Template Landscape Archetype – Multiple Instances

Template Master

Template Testing

DEV 1

QAS 1

Pre-Prod 1

PRD 1

CTS

CTS

CTS

CTS

CTS

CTS

DEV 2

QAS 2

Pre-Prod 2

PRD 2

CTS

CTS

CTS

CTS ……

- Common Global Template including handled in this line
- Intent to separate template development and production operations.
- A variation with DEV serving as the template master is also possible, without the template line.

- Individual productions lines per instance.
- Local variations to the template handled in individual DEV systems.
- Regression testing scope handled separately per production line.
- More complex template governance across Template Master and individual production lines.

## Template Landscape Archetype – Single Global Instance

Template Master

Template Testing

DEV

QAS

Pre-Prod

PRD

CTS

CTS

CTS

CTS

CTS

- Entire Global Template including regional variations are handled in this line.
- Intent to separate template development and production operations.
- A variation with DEV serving as the template master is also possible, without the template line.

**Template Line**

**Production Line**

- Regression testing scope is for entire template scope.
- Simpler template governance.

## Module Delivery

## Delivery Guide

**Inputs & Pre-requisites**

- Strategy Input / Business Objectives
- Business Architecture & Target application architecture (if available)
- Existing template strategy (if applicable)

**Predecessor Modules**

- Strategy Mapping (required)
- Business Capability Scoping and Mapping (required)
- Business Process Scoping and Mapping (optional)
- Target application architecture (optional)

**Successor Modules**

(Tasks)

- Understand and contextualize customer strategy
- Assess target landscape if available
- Translate customer strategy and target landscape into roadmap drivers
- Document customer priorities and constraints
- Document target benefits
- Build template evaluation and scope

**Controls &** \
**Methodology**

**Output**\
(used how &\
where)

- SAP Activate
- North Star Methodology

**Input**\
re-use how\
to use, …

- Product Map Generator
- SAP Activate Roadmap Viewer
- Microsoft Office Templates

**Artefacts / Deliverables** (interim & Final)

- Business Strategy to Template Strategy Derivation
- Template Drivers, scoring and evaluation
- Template Priorities, Constraints and Benefits

**Accelerators**\
**& Tools**

**Purpose**

The purpose of this module is to assess/design the Global Template strategy for a customer. To determine the needs and benefits that will drive such a strategy and identify the key building blocks that can be used to operationalize the strategy.

**Scope**

- Documentation of template drivers as derived from customer business strategy
- Prioritization and scoring for customer context
- Definition of a template roadmap in terms of subsequent steps and value

**Delivery Context**

This module can be delivered standalone or as part of a chain of modules delivery. The module should be used in situations where the customer business strategy will benefit from the use of a template or where the customer already has a template which should be considered when deciding the landscape strategy and roadmap.

**Template Assessment**

## Understand and Contextualize Customer Strategy

| Area | Questions | Impact on Template Decision |
| --- | --- | --- |
| Business Strategy | What are the key business strategy elements that will benefit from the implementation of a global template? | A clear definition of the benefits of a global template in support of the business strategy is required to obtain the key management mandate to implement a template. |
| Stakeholder analysis | Does the management structure allow for the implementation of a global template? Are the key business and IT stakeholders amenable to enforcing a template? | Identify key supporters and possible detractors with the objective of getting an organizational mandate. |
| IT Strategy | Is the future IT strategy aligned with the management of a global template. Key considerations:<br>• Centralized vs. Decentralized IT spend<br>• Centralized vs. Decentralized IT organization and processes<br>• Landscape strategy (instance strategy, change management strategy) | Template governance is dependent on IT strategy, processes and landscape alignment to implement template integrity. IT will have a direct impact on the complexity of implementing template governance in terms of execution. |

## Assess and Document Template Drivers – Business & IT Drivers

Identify the business and IT strategy elements and impact from a template implementation. Details provided are examples only. The objective of the evaluation is to identify if strategic priorities will benefit from a template. Some priorities may be template neutral or even negative; all are to be documented.

| Strategy Element | Template Element | Target Benefit | Process Readiness | Organizational Readiness |
| --- | --- | --- | --- | --- |
| Implement global processes to benefit from economies of scale and support rapid expansion, starting with the European Union. | • Processes<br>• Master Data<br>• Organizational Units<br>• Governance | • Standard ways of working<br>• Global KPIs and benchmarking<br>• Faster time to market for onboarding new businesses | • Low – processes and master data are highly regional and/or division specific | • Low – Decentralized authority and budgets by region |
| Centralized IT to facilitate skill retention and lower total cost of ownership of the estate | • Master Data<br>• Processes<br>• Governance<br>• Solutions | • Optimal planning and execution of skill requirements<br>• Lower TCO through centralization and landscape optimization | • Low – IT processes are decentral by application landscape | • Medium – Centralization of critical application teams is in design and can be extended |
| …….. |  |  |  |  |
| …….. |  |  |  |  |
| …….. |  |  |  |  |

## Assess and Document Template Drivers – Stakeholder Analysis

| Business Division | Regional Unit | Markets Serviced | Process Independence | Master Data Independence | Org. Unit Independence* |
| --- | --- | --- | --- | --- | --- |
| Sales | Europe East | Czech Republic<br>Hungary<br>Poland <br>Romania | High | High | High |
| Sales | Europe West | Germany<br>France<br>Belgium<br>Netherlands | High | High | High |
| Sales | Asia | SEA<br>Japan | Low | Low | Low |
| Manufacturing (includes Procurement and Maintenance) | Poland<br>Romania | Sales | High | High | High |
| Support Services | Finance<br>HR | All Units | High | High | High |

If a concrete mandate exists for a target stakeholder map, create another evaluation for the target state along similar lines. The objective is to gauge template scope and get inputs into the alignment that will become necessary during the template roadmap.

\* Org Unit independence refers to structure and more importantly representation in terms of profit centers, cost centers etc. The overarching requirement is to evaluate standardization for reporting and control.

## Assess and Document Template Drivers – Stakeholder Alignment

Objectives (1) Standardization assessment (2) Identify areas that will require stakeholder alignment (3) Try and identify leading practices in Business Divisions that can be the basis for the template.

Separate alignment matrices should be created for Business Process, Master Data and architecture commonality to assess the various angles of the template.

|  | Sales – Europe East | Sales -  Europe West | Sales - Asia | Manufacturing - Romania | Manufacturing - Poland | Finance | HR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sales – Europe East |  | **Medium** | **Medium** | NA | NA | NA | NA |
| Sales -  Europe West | **Medium** |  | **High** | NA | NA | NA | NA |
| Sales - Asia | **Medium** | **High** |  | NA | NA | NA | NA |
| Manufacturing - Romania | NA | NA | NA |  | **Low** | NA | NA |
| Manufacturing - Poland | NA | NA | NA | **Low** |  | NA | NA |
| Finance | **Medium** | **Medium** | **Medium** | **Medium** | **Medium** |  | NA |
| HR | **Low** | **Low** | **Low** | **Low** | **Low** | NA |  |

## Assess and Document Template Drivers – Customer Priorities and Constraints

Document customer priorities and constraints that will impact the template decision.

| Topic | Classification | Classification Level | Impact on Template Decision |
| --- | --- | --- | --- |
| APJ global system is out of maintenance and needs to be replaced. A local assessment is currently ongoing. | Priority | High | No direct impact on template decision but will impact rollout priorities if template is created. |
| EMEA operations use disparate systems and processes. Comparative finance and sales reporting is not possible without extensive reclassification of data. | Priority | High | A global template with standard processes and data models can mitigate this problem. |
| Management changes in APJ will have an impact on their decision to accept a global template. | Constraint | High | An assessment of global impact with and without APJ has to be done or an assumption with a timeline has to be built into the planning. |
|  |  |  |  |
| …….. |  |  |  |

## Assess and Document Template Drivers – Expected Benefits

Document expected benefits and measurement criteria for the template.

| Organization Impacted | Type of Benefit | Measurement Criteria | Measurement Start Timeframe |
| --- | --- | --- | --- |
| IT | A global template can drive rationalization of skills, centralize processes and eliminate redundancies. | IT Cost measure in terms of budget and FTEs. | Six months after the first rollout of the template. |
| Business | Standardization through template elements will allow for comparative analysis of profitability. | Cross entity profitability reporting. | On rollout of the template to more than one entity. |
| Business | Financial consolidation for each region will take five working days instead of the current twelve. | Days to accounting consolidation completion post local entity close. | On rollout of the template to cover an entire consolidation unit. |
|  |  |  |  |
| ……. |  |  |  |

## Assess and Document Template Drivers – Success Criteria for Template

Document expected success criteria mandatory for the template implementation to be successful

| Criteria | Explanation | Assessment |
| --- | --- | --- |
| Management Mandate | There needs to be a clear management mandate communicating the corporate agenda as a rationale, given the business impact and Region / LoB stakes.<br>This mandate also provides the basis for template governance at the enterprise level. | • Reservations about regional variations and processes have been expressed in various workshops<br>• Process rationalization assessments across existing systems should be carried out<br>• Target Operating Model for business and IT were not available for assessment and the template should be aligned if necessary. |
| Master Data Centralization | The target architecture benefit will be largely dependent on a global data model across financials and logistics. | • The Master Data Governance scope (currently mainly around Business Partners) need to be strengthened to cover Finance and Logistics in source and central systems. |
| Process Standardization | Central Finance and Procurement will drive standardization through data transformation from existing systems. However, a process template for source systems needs to be created for them to cater to new scope as well as streamlining of existing implementation. | • Template recommendations have been provided and need to be reviewed and detailed.<br>• Harmonization during system consolidation will result in progressive template scope increase. |

## Template Scope – High Level

Document template scope at the required level based on driver assessments carried out so far. A global template is the ideal situation for all standardization requirements; constraints and governance limitations will drive any split.

| Function | Template Scope | Basis | Applicability |
| --- | --- | --- | --- |
| Finance | • Group Finance (XXXX Finance Data Model and Processes) for CFIN<br>• Operational Finance Template for source systems | • CFIN best practices<br>• SAP S/4HANA Finance Data Model<br>• SAP Reference Business Architecture BPML provided as part of service<br>• Data transformation guidelines for sources system mapping<br>• Finance guidelines for sources system changes | XXXX group wide covering all systems |
| Purchasing | • Procurement orchestration using Central Procurement | • Central Procurement best practices<br>• Procurement guidelines for source system changes<br>• SAP Reference Business Architecture BPML provided as part of service | Not final as an eProcurement tender is ongoing. Will depend on target solution model |
| Plant Maintenance | • XXXX Plant Maintenance master data and operational processes | • Not covered in scope of study | Generic recommendation on adoption of SAP Enterprise Asset Management architecture in source systems |
| Services & Sundry Billing | • Inclusion of current process scope across XXXX as part of operational finance template | • Existing XXXX processes after harmonization | XXXX group wide covering all systems |
| Sales and Marketing | • SAP Footprint limited and not consistent group wide | • The vehicle footprint and processes are not consistent enough across systems to conclude. | A study on the applicability of a common billing solution to be conducted. |

## Template Scope – Process Mapping

- To provide customers with first cut process scope for templates, the SAP [RBA](https://sap.sharepoint.com/teams/SAPEnterpriseArchitectureReferenceLibrary/SitePages/Home.aspx) assets should be used. RBA content is available in the EAD and PMG tools.

## Template Build – Building Blocks

| Template Area | Building Blocks |
| --- | --- |
| Solution Architecture | • Identified global business requirements as a Business Process Master List<br>• Template Solution • Organization Structure • Master Data • Process Blueprints • Target Applications<br>• Localization guidelines |
| Data Architecture | • Global Data Model and standards<br>• Analytics Strategy |
| Application Architecture | • Target Landscape |
| Governance | • Global Template Core Team definition<br>• Cadence<br>• Design Authority and Change Management guidelines<br>• Template deployment strategy |

## Template Build – Phases

Analysis and Design

Setup and Enablement

Discover

Prepare

Explore

Realize

Deploy

Run

Discovery Assessment

Configure and Extend

Migrate and Integrate

Test

Template Completion

Rollout

- Template Mandate
- Project Mobilization

- Target Operating Model
- Target Landscape
- Team enablement

- Template Design

- Template Readiness

- Configured Template

- Handover to Rollout Team

- Build Rollout Kit

## Module Scoping

## Effort Estimation Guidelines and Roles

| Baseline Formula | PD = BD\*(LoB*0.5) |
| --- | --- |

| Driver | Description | Estimation Guidelines |
| --- | --- | --- |
| Business Divisions (BD) | Distinct parts of the business that will need to be covered by the service and will provide distinct stakeholders and participants for the service thereby necessitating effort, analysis and sub deliverables. If there are multiple divisions covered that can be clubbed together from this perspective, please reduce the count appropriately by clubbing them together. | Number of distinct business divisions (only relevant if strategy is different in the divisions) |
| Enterprise Domain (LoB) | The business functions that are performed within the Business Divisions. This corresponds to the Enterprise Domain in the RBA model. Use of same Enterprise Domains across Business Divisions will only lead to a count of one. The count should therefore reflect the unique number of Enterprise Domains across the enterprise. | This module is to be delivered by an experienced EA familiar with the RBA processes. No addition experts by Enterprise Domain are envisaged. |

| Role | Description | Effort Drivers | Effort Allocation Guidelines |
| --- | --- | --- | --- |
| Enterprise Architect | Service Lead and EA |  | 90% of overall effort |
| Contingency | In case of ad-hoc expertise/consultation |  | 10% of overall effort |

## Module Report

## Summary of Recommendations

Finance*

Purchasing

Plant Maintenance

Services & Sundry Billing

Sales and Marketing

Investments

Home & Vendor Tooling

R&D

Spare Parts

Supply Chain

Used Cars

**Business Drivers**

**SAP Footprint1**

**SAP Template Feasibility 2**

**Maturity of standard SAP Automotive Solutions / Practices**

**Recommendation**

1 Broad Assessment

Gauge with solid fill

Gauge with solid fill

HR

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Speedometer Low with solid fill

Speedometer Low with solid fill

- Unified Data Model & processes
- Reporting & Analytics

- Unified purchase processes
- Spend Analysis

- Not available

- Not available

- Not available

- Aligned with Finance drivers
- Uniform processes and control

- Leverage existing investments

- Leverage existing investments

- Not available

- Not available

- Not available

- Unified employee experience
- Standard processes

- SAP Central Finance (CFIN) based template
- Financial Master Data Governance

- SAP Central Procurement based template
- Discussions limited due to eProcurement tender

- Not covered in the study. Potential to standardize operations processes with increased SAP footprint

- Existing processes can converge to a standard process group.

- Limited SAP footprint. Convergence of billing in SAP will be dependent on the use of SAP VMS and vehicle inventory.

- As the footprint is primarily based on cost control, needs to be part of the finance template.

- Existing processes can converge to a standard process group.

- Existing processes can converge to a standard process group..

- Template feasibility is high if SAP footprint is extended with solutions such as eSPP or a limited template for order management process is possible.

- Limited SAP footprint. Core manufacturing is non SAP and has impact on inventory and billing functions in SAP. Point solutions such as SAP TM are options.

- Outside SAP

- Not discussed in service due to HRMS tender.

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Gauge with solid fill

Speedometer Low with solid fill

2 Feasibility is based on business drivers, SAP Footprint, SAP Automotive maturity and additional possibilities where detailed in recommendation. System Complexity as a measure was not used. Please refer Appendix B for details.

**\* Covers accounting for logistics processes**

Gauge with solid fill

Speedometer Low with solid fill

ILLUSTRATIVE – Template evaluation based on existing footprint vs. standard SAP practices.

Mohammed Yaseen

m.yaseen@sap.com

## Appendix

## Roadmap

**Inputs & Pre-requisites**

- Template Definition

**Predecessor modules**

- Template Assessment

(Tasks)

- Understand and contextualize customer template requirements
- Discuss specific actions for the customer under each building block.
- Create a build roadmap with timelines.

**Controls &** \
**Methodology**

**Output**\
(used how &\
where)

- SAP Activate
- QA criteria

**Input**\
re-use how\
to use, …

- PMG
- SAP Activate Roadmap Viewer
- Microsoft Office Templates

**Artefacts / Deliverables** (interim & Final)

- Template building block artefacts.
- Template build plan with the depth agreed with the customer (use SAP Activate)

**Accelerators**\
**& Tools**

**Purpose**

The purpose of this module is to formalize the template build strategy for the customer. Determine the needs that will drive such a strategy and identify the key building blocks that can be used to operationalize the strategy.

**Scope**

- Identification of building blocks that the customer should use.
- Definition of high level template build roadmap.

**Delivery Context**

This module can be delivered standalone or as part of a chain of modules delivery. The module should be used in situations where the customer has concluded on the need for a template and is looking at broad planning on the next steps.

**Template Assessment**

**Depth:** D2

**Owner:** Mohammed Yaseen

**Template Build**

## Template Governance

think-cell Slide

## Customer Example for Overall Governance – Keeping the Gates

1. Enterprise Architecture           (ERP main focus)

2. Alignment with Business Strategy

3. Alignment with IT Strategy

1

2

3

**SAP/MC**

**Executive Interlock**

**Customer example**

**SAMPLE**

> Per-Henrik

## Template Landscape

## Roadmap

**Inputs & Pre-requisites**

- Existing template details and governance.
- Organizational priorities and business strategy.

**Predecessor modules**

- Template Strategy (required)
- Template Build (required)
- Template Governance (required)

(Tasks)

- Understand and contextualize the customer template content and governance strategy.
- Determine possible rollout strategy with prioritization.

**Controls &** \
**Methodology**

**Output**\
(used how &\
where)

- SAP Activate
- QA criteria
- Module Implementation and Rollout Strategy

**Input**\
re-use how\
to use, …

- PMG
- SAP Activate Roadmap Viewer
- Microsoft Office Templates

**Artefacts / Deliverables** (interim & Final)

- Template rollout strategy prioritization criteria.
- Template rollout high level plan and timeline.

**Accelerators**\
**& Tools**

**Purpose**

The purpose of this module is to assess/design the Global Template Rollout strategy for a customer. Determine the needs and benefits that will drive such a strategy and identify the key elements that have to be considered for the rollout.

**Scope**

- Overview of rollout possible rollout options.
- Prioritization and scoring to aid selection of an optimal rollout strategy.

**Delivery Context**

This module can be delivered standalone or as part of a chain of modules delivery. The module should be used in situations where the customer has defined or is planning to define a template and determine the most optimal approach to deployment given their organization and priorities.

**Template Assessment**

**Depth:** D2

**Owner:** Mohammed Yaseen

**Template Assessment**

## Planning Factors for Template Rollout

| # | Factors | Evaluation Criteria |
| --- | --- | --- |
| 1 | Template Completeness | • The template should be complete in the sense that ensure business integrity (data, processes, applications) for the target business units to which they will be rolled out. <br>• Implementation cookbooks for use by the implementation team should be available. |
| 2 | Template Governance | • The Global Template Core Team (GTCT) should have been instituted and operationalized.<br>• Template Governance model should have been defined and operationalized with management approval provided and agreed with all business units planned for the rollout. |
| 3 | Template Implementation | • The template Implementation Team planning should be in place covering the following. • Template knowledge transfer • Planned composition of team (internal vs. partner) • Team logistics (locations, processes for deployment, visa planning, etc.) |
| 4 | Template System | • Reference system for template<br>• Template deployment landscape (Change and Transport System) |

## Rollout Methods

| # | Method | Characteristics | Decision Criteria |
| --- | --- | --- | --- |
| 1 | Big Bang | • The template is implemented for the entire organizational scope (regions, entities) and cut over happens simultaneously. | • Availability of internal and external resources.<br>• Internal Project Management capability.<br>• Scale of risk to be handled considering template business scope. |
| 2 | Phased | • The template is implemented for selected organizational scope (regions, entities) as discrete phases with specific resources. A phased approach can be either of the following. • Serial: The organizational scope is implemented in successive phases with little or no overlap. • Parallel: The organizational scope is implemented in parallel with separate resources. | • Availability of internal and external resources.<br>• Internal Project Management capability.<br>• Risk evaluation considering organizational scope and approach (serial, phased). |
| 3 | Pilot | • The template is implemented for selected organizational scope (region, entity) in order to determine template effectiveness and identify key issues that need to be addressed before rollout to entire organizational scope. Subsequent to the pilot, either the Big Bang or Phased approach can be planned. | • Template readiness and project management capability are to be tested prior to the full rollout. |

## Rollout Dimensions

| # | Dimensions | Definition | Decision Criteria |
| --- | --- | --- | --- |
| 1 | Region | • The template is rolled out for all business units in the target region. | • Availability of internal and external resources.<br>• Internal Project Management capability.<br>• Scale of risk to be handled considering template business scope. |
| 2 | Business Unit | • The template is rolled out for individual business units. | • The business unit should ideally be a Legal Entity to avoid having to deal with split financials.<br>• In case existing processes are split by system below a legal entity (profit center, division) this approach is a suitable approach.<br>• This approach can lead to additional requirements for integration build during rollouts based on existing landscape. |
| 3 | Function / Process | • The template is rolled out for a function (such as finance or supply chain) or for defined processes. | • Suitable if the template structure logically allows for this from a design perspective (e.g. core processes on SAP S/4HANA and planning on SAP IBP).<br>• Otherwise should be considered only if specific organizational or landscape requirements have constraints or provide specific advantages that suggest this approach. |

## Rollout scenarios ranking and evaluation

Worksheet

**SAMPLE**

## Rollout Team Planning

**Design**

**Board**

**Local Steering Committee**

**Rollout 4**

**Local Process**

**Owners**

**Rollout 5**

**Rollout n**

**Program**

**Management**

**Office**

**Global Template Development**

**Roll-out Factory**

**Base**

**Support**

**Global Steering Committee**

Business Sponsor, CIO

**Local Steering Committee**

**Local Process**

**Owners**

**Local Steering Committee**

**Local Process**

**Owners**

**Roll-out Factory  supported**\
**by small local roll-out-teams**

**1st level**

**support**

**Local Process**

**Owners**

**1st level**

**support**

**Local Process**

**Owners**

**1st level**

**support**

**Local Process**

**Owners**

**Support**

**Quality**

**Assurance**

**Org Change**

**Management**

**& Communication**

**BU1/Country 1**

**Country 2**

**Country 3**

**2nd level**

**Support**

**Change Control**

**Global Process Owners**

**Architecture**

**Board**

**SAMPLE**
