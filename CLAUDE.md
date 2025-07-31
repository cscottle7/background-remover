\# Project: CharacterCut

\#\#\# Executive Summary

CharacterCut is a web-based tool designed as a \*\*Research & Development Initiative\*\* to explore the market for AI-powered, developer-focused creative tools. The MVP will offer a fast, frictionless, and free-to-use background removal service for AI-generated character assets. Its primary strategic goal is not direct revenue, but to gather data on user engagement, feature demand, and technical viability to inform the development of future commercial products. Key risks include the reliance on a single open-source library and the financial unsustainability of a free service, which are being mitigated by researching alternative technologies and defining the project's value in terms of market intelligence rather than profit.

\---

\#\#\# 1\. The Press Release

FOR IMMEDIATE RELEASE

\*\*CharacterCut Launches to Streamline Asset Creation for Australian Developers\*\*

ADELAIDE, SA – Today marks the launch of CharacterCut, a new web tool designed to transform the asset creation experience for app and game developers. CharacterCut offers effortless, one-click magic for removing backgrounds from AI-generated character images, revealing perfect, transparent PNGs in moments. Built to make complex tasks disappear, the service helps creators move from concept to implementation with unprecedented ease, transforming tedious editing into delightful drag-and-drop magic.

\---

\#\#\# 2\. Customer FAQ

\* \*\*Pricing & Access:\*\* How much does CharacterCut cost? Is there a free tier for small projects, or is it a subscription service?

\* \*\*Privacy & IP:\*\* What happens to the images I upload? Are they stored on your servers, and if so, for how long? Critically, do you claim any intellectual property rights over the characters I process?

\* \*\*API & Integration:\*\* Is there an API I can use to integrate this directly into my own build pipeline or content management system? If so, what are the rate limits and costs?

\* \*\*Technical Limits:\*\* What are the maximum image resolution and file size I can upload? Does the tool work with formats other than JPG/PNG, like WEBP or HEIC?

\* \*\*Feature Specifics:\*\* How does the 'Character Sheet' feature handle characters that are partially overlapping or have inconsistent spacing? Can I manually adjust the detection boxes?

\* \*\*Quality & Refinement:\*\* How accurate is the edge detection on complex subjects like wispy hair, smoke effects, or semi-transparent clothing? Is the 'Refine Edge' tool available for all users?

\* \*\*Batch Processing:\*\* Is there a limit on how many images I can queue up for batch processing at one time?

\* \*\*Browser Extension:\*\* When will the browser extension be available, and will it support browsers like Firefox and Safari in addition to Chrome?

\---

\#\#\# 3\. Internal FAQ

\* \*\*Strategic Goal:\*\* What is the core strategic purpose of this project?

    \* This project is a \*\*Research & Development Initiative\*\*. Its primary purpose is to act as a low-cost experiment to validate the market for developer-focused AI tools, gather real-world usage data, and collect user feedback. \[cite\_start\]The success of the MVP is measured by the quality of insights gained to inform future commercial products, not by direct revenue. \[cite: 56-58\]

\* \*\*Technical Feasibility & Risk:\*\* Are we building our own machine learning model or licensing a third-party API? What is our contingency plan?

    \* The core functionality relies on the \`rembg\` open-source library with multiple model options (\`isnet-general-use\`, \`birefnet-general\`, \`u2net\`, \`sam\`) providing built-in redundancy. \[cite\_start\]The mitigation strategy includes implementing model fallback chains and researching at least two alternative background removal libraries or APIs during the initial development phase. \[cite: 64-66\] Session-based architecture allows for dynamic model switching without service interruption.

\* \*\*Differentiation & Market Strategy:\*\* How is this project defensible against competitors?

    \* Our key differentiators are the 'Character Sheet' feature and developer-focused UX. \[cite\_start\]The defence lies in speed to market and using the insights gathered from the free tier to rapidly build high-value, paid features (like 'Character Sheet' processing and API access) that competitors may be slower to address for this niche audience. \[cite: 41, 62-63\]

\* \*\*Monetisation & Business Model:\*\* What is the business model and how do we manage the financial risk of a free service?

    \* The MVP will be a single free tier, with operational costs accepted as an R\&D expense. There is no immediate monetisation plan. \[cite\_start\]Data on user engagement, retention, and feature requests will be used to build a business case for a future, commercially viable product with paid tiers. \[cite: 59-61, 45\]

\* \*\*Performance at Scale:\*\* Have we benchmarked the server load for key features? \[cite\_start\]What is our strategy for maintaining performance? \[cite: 33-34\]

\* \[cite\_start\]\*\*Front-End Complexity:\*\* How much development effort do the "Magic Eraser" and "Refine Edge" features require? \[cite: 35-36\]

\* \[cite\_start\]\*\*Cost & Resources:\*\* What is our estimated monthly operational cost? \[cite: 37-38\]

\* \[cite\_start\]\*\*Team Allocation:\*\* What is the required team composition for the MVP? \[cite: 39-40\]

\* \[cite\_start\]\*\*Go-to-Market:\*\* What is our specific, costed plan to reach the Australian developer community? \[cite: 43-44\]

\* \[cite\_start\]\*\*Scope Creep & Product Roadmap:\*\* What is the absolute minimum feature set for version 1.0? \[cite: 49-50\]

\* \[cite\_start\]\*\*Long-Term Vision:\*\* Is 'CharacterCut' intended to remain a niche tool or is this a first step towards a broader suite of tools? \[cite: 51\]

\---

\#\#\# 4\. Project Goal & High-Level Requirements

The primary goal of this project is to fulfill a specific Job-to-be-Done for our target user, an app or game developer.

\[cite\_start\]\*\*JTBD Statement:\*\* When I'm in the middle of a creative workflow and have just generated a new character asset, I want to instantly and cleanly remove its background without switching contexts or using complex software, so I can immediately test the character in my game engine or app to keep my development momentum going. \[cite: 54\]

\---

\#\#\# 5\. Brand Identity & Archetype

\* \*\*Primary Brand Archetype:\*\* The Magician. The brand makes complex problems disappear effortlessly, transforming a tedious task into a delightful moment of creation. CharacterCut reveals the hidden potential within every image, conjuring perfect characters from cluttered backgrounds with seemingly impossible ease.

\* \*\*Archetypal Promise:\*\* To transform friction into effortless flow.

\* \*\*Tone of Voice:\*\* Transformative, confident, and wonder-inspiring. The language makes complex tasks feel effortlessly magical while respecting developers' expertise and time. Communication focuses on transformation outcomes rather than technical processes.

\---

\#\#\# 6\. Core Product Persona & Motivational Design

\* \*\*Target User Archetype:\*\* "Chloe, the Indie Creator". A solo or small-team developer who values speed, efficiency, and tools that enhance their creative momentum without imposing a steep learning curve or complex workflow.

\* \*\*Primary Motivational Need (SDT):\*\* Competence and Autonomy. Chloe is motivated by feeling effective and in control of her creative process.

\* \*\*Core Motivational Strategy:\*\* Empower Chloe by removing tedious, flow-breaking tasks. The product's success is defined by how invisible and instant it feels, allowing her to stay focused on her primary goal of creating.

\---

\#\#\# 7\. Core UX Principles

\* \[cite\_start\]\*\*Frictionless Workflow:\*\* The core design principle of eliminating unnecessary steps for the user, achieved through a unified input interface that seamlessly handles upload, drag-and-drop, and paste without forcing users to choose between methods. \[cite: 71\]

\* \[cite\_start\]\*\*Flow State Preservation:\*\* Users must maintain creative momentum without context switching. The interface auto-proceeds through processing with subtle feedback, copies results to clipboard automatically, and provides "Process Another" workflows for session continuity. \[cite: 73\]

\* \*\*Performance as a Feature:\*\* The application must feel instantaneous. \[cite\_start\]Average processing speed must be maintained under 5 seconds with micro-interactions during processing to maintain engagement and clear completion signals. \[cite: 86\]

\* \*\*Progressive Error Recovery:\*\* The system gracefully handles failures through auto-retry, format conversion, and quality adjustment without breaking user flow. Single failures cannot derail the entire user journey.

\* \*\*Context-Aware Success:\*\* Results are delivered in formats that minimize workflow disruption - automatic clipboard copy for immediate use alongside traditional download options.

\---

\#\#\# 8\. Core Definitions & Glossary

\* \*\*Asset:\*\* Refers to the final, processed, downloadable file. \[cite\_start\]This is the transparent PNG image of the isolated character. \[cite: 68\]

\* \[cite\_start\]\*\*Character Sheet / Sprite Sheet:\*\* A single image file containing multiple, distinct, non-overlapping poses of a single character. \[cite: 69\]

\* \[cite\_start\]\*\*Perfect Reveal:\*\* The quality standard for a successfully processed image, meaning sharp edges with minimal "haloing" and correct transparency. \[cite: 70\]

\* \[cite\_start\]\*\*Magic Eraser:\*\* A simple, post-processing clean-up tool for removing minor background artifacts. \[cite: 72\]

\* \[cite\_start\]\*\*MVP (Minimum Viable Product):\*\* The initial launch version limited to 'Perfect Reveal' on single images. \[cite: 74\]

\* \[cite\_start\]\*\*Edge Enchantment:\*\* An optional, secondary processing mode for complex images that trades speed for higher quality. \[cite: 75\]

\---

\#\#\# 9\. Success Metrics & Measurement Plan

Success for the MVP will be tracked within the first month post-launch with the following KPIs:

\* \*\*User Adoption & Reach:\*\*

    \* \[cite\_start\]\*\*Unique Active Users:\*\* Achieve 250 unique active users from the Australian developer community. \[cite: 79\]

    \* \[cite\_start\]\*\*Acquisition Channel Effectiveness:\*\* Identify the top 3 referral channels driving quality traffic. \[cite: 80\]

\* \*\*Engagement & Value Validation:\*\*

    \* \[cite\_start\]\*\*Session Return Rate:\*\* Track bookmark/direct-return usage as proxy for retention in absence of accounts. Target 15% Week 1 return visits. \[cite: 82\]

    \* \[cite\_start\]\*\*Session Continuity:\*\* The average engaged user processes at least 2 images per session, enabled by "Process Another" workflow continuity features. \[cite: 83\]

\* \*\*Performance & Quality:\*\*

    \* \[cite\_start\]\*\*Task Completion Rate:\*\* 95% of attempted uploads result in a successful asset delivery (download or clipboard copy), supported by progressive error recovery systems. \[cite: 85\]

    \* \[cite\_start\]\*\*Average Processing Speed:\*\* Maintain an average end-to-end processing time of under 5 seconds. \[cite: 86\]

\* \*\*User Satisfaction:\*\*

    \* \[cite\_start\]\*\*Net Promoter Score (NPS):\*\* Achieve a positive score via an in-app survey. \[cite: 88\]

    \* \[cite\_start\]\*\*Qualitative Feedback Volume:\*\* Receive at least 15 detailed feedback submissions. \[cite: 89\]

\---

\#\#\# 10\. Core Features & Scope

\*\*In Scope (for MVP)\*\*

\* \[cite\_start\]As a developer, I want to input a single character image through a unified interface (upload/drag-drop/paste), so that I can have its background removed automatically without choosing between input methods. \[cite: 92\]

\* \[cite\_start\]As a developer, I want to see a brief auto-proceeding preview of the change with subtle feedback, so that I can verify quality without breaking my flow state. \[cite: 93\]


\* \[cite\_start\]As a developer, I want the processed image delivered via both automatic clipboard copy and download option, so that I can immediately use it in my project without context switching. \[cite: 96\]

\* \[cite\_start\]As a user, I want to access the core features without needing to create an account, so that I can get my task done with minimum friction. \[cite: 97\]

\* \*\*As a developer, I want graceful error handling with auto-retry and format conversion, so that single failures don't break my entire workflow.\*\*

\* \*\*As a developer, I want "Process Another" session continuity, so that I can handle multiple images without restarting the entire flow.\*\*

\*\*Out of Scope (Post-MVP)\*\*

\* \[cite\_start\]As a game developer, I want to upload a full 'Character Sheet', so that I can batch process all poses at once. \[cite: 99\]

\* \[cite\_start\]As a creator, I want access to an 'Edge Enchantment' tool, so that I can achieve higher-quality results. \[cite: 100\]

\* \[cite\_start\]As a creator, I want a 'Magic Eraser' tool, so that I can quickly clean up any minor artifacts. \[cite: 101\]

\* \[cite\_start\]As a power user, I want to access an API, so that I can programmatically integrate the service. \[cite: 102\]

\* \[cite\_start\]As a frequent user, I want to create an account, so that I can view my history and manage a subscription. \[cite: 103\]

\* \[cite\_start\]As a developer, I want to use a browser extension, so I can send images directly from AI art generators. \[cite: 104\]

\---

\#\#\# 11\. Tech Stack & Key Libraries

\*\*Backend Architecture\*\*

\* \*\*Core Processing:\*\* Python with \`rembg\` library (latest version supporting session management and new models)
\* \*\*Deployment:\*\* Serverless Framework with session-aware cold start optimization
\* \*\*Model Strategy:\*\* Primary: \`isnet-general-use\` for AI-generated characters, Fallback: \`u2net\` for compatibility
\* \*\*Session Management:\*\* Global session instance per serverless function with \`new_session()\` for optimal performance
\* \*\*Response Handling:\*\* \`force_return_bytes=True\` for consistent API responses across all processing modes

\*\*Frontend Stack\*\*

\* \*\*Framework:\*\* Svelte & SvelteKit (recommended) or React & Next.js (alternative)
\* \*\*File Handling:\*\* \`svelte-file-dropzone\` (or equivalent) for drag-and-drop functionality
\* \*\*Clipboard Integration:\*\* Native Browser Clipboard API for paste functionality and automatic result copying
\* \*\*Performance Monitoring:\*\* Client-side timing to ensure <5 second processing compliance

\*\*Key Dependencies & Installation\*\*

```python
# Backend requirements
pip install "rembg[cpu]"  # CPU-optimized for serverless
# OR for GPU-enabled instances:
pip install "rembg[gpu]"  # NVIDIA CUDA support
```

\*\*Rembg Integration Patterns\*\*

```python
# Optimized session management for serverless
from rembg import new_session, remove

# Initialize once per function instance
REMBG_SESSION = new_session("isnet-general-use")

def process_image(image_bytes):
    # Reuse session for all requests
    return remove(image_bytes, 
                 session=REMBG_SESSION,
                 force_return_bytes=True)
```

\---

\#\#\# 12\. Architectural Principles & Constraints

\* \[cite\_start\]\*\*Security First:\*\* All user-uploaded content must be treated as untrusted and handled in a secure, isolated environment. \[cite: 135\]

\* \*\*Privacy by Design:\*\* User images will not be stored for longer than 1 hour post-processing. \[cite\_start\]Minimum necessary user data will be collected. \[cite: 136-137\]

\* \*\*Stateless by Default:\*\* Backend services should be stateless to allow for scalable, serverless deployment.

\* \*\*Session-Optimized Performance:\*\* While maintaining stateless principles, rembg sessions are initialized once per serverless function instance and reused across requests to achieve the <5 second processing target. Sessions are not persisted between function cold starts.

\*\*Rembg Architecture Principles\*\*

\* \*\*Model Selection Strategy:\*\* Use \`isnet-general-use\` as primary model for AI-generated character assets, with automatic fallback to \`u2net\` for compatibility
\* \*\*Memory Management:\*\* Sessions are created once per function instance and reused to minimize model loading overhead
\* \*\*Error Recovery Enhancement:\*\* Leverage \`force_return_bytes=True\` for consistent response handling in progressive error recovery
\* \*\*Quality Optimization:\*\* Implement alpha matting (\`alpha_matting=True\`) for Edge Enchantment feature in post-MVP
\* \*\*Background Replacement:\*\* Support \`bgcolor\` parameter for solid background replacement in future iterations

\*\*Testing Philosophy\*\*

\* \*\*Flow-State Testing:\*\* Testing must preserve the user's creative flow. All tests should validate the <5 second processing time and seamless input interface experience described in Chloe's user journey.

\* \*\*Cross-Browser Compatibility:\*\* Given the Clipboard API and drag-drop dependencies, comprehensive browser testing across Chrome, Firefox, Safari, and Edge is mandatory. Feature detection and graceful fallbacks must be validated.

\* \*\*Error Recovery Validation:\*\* Progressive error recovery systems require extensive failure scenario testing. Tests must validate auto-retry mechanisms, format conversion fallbacks, and graceful degradation without breaking user flow.

\* \*\*Performance-First Testing:\*\* All tests must validate the "Performance as a Feature" principle. End-to-end tests must fail if processing exceeds 5 seconds or if the scanline animation doesn't provide adequate feedback during processing.

\* \*\*Privacy & Security Testing:\*\* Automated tests must validate the 1-hour image deletion policy, secure upload handling, and ensure no user data leakage beyond essential success metrics.

\* \*\*Testing Approach:\*\* 
  - \*\*Backend:\*\* TDD approach for all image processing logic and alternative library integration
  - \*\*Frontend:\*\* Component testing for unified input interface, end-to-end testing for complete user workflows using Playwright
  - \*\*Integration:\*\* Full workflow testing across all supported browsers and input methods
  - \*\*Performance:\*\* Continuous performance regression testing with <5 second processing thresholds

\*\*Forbidden Actions\*\*

\* DO NOT store user image data for longer than the 1-hour processing window.

\* DO NOT introduce any user tracking or analytics beyond what is essential for measuring the core Success Metrics.

\* DO NOT require user sign-up or authentication for any MVP features.

\---

\#\#\# 13\. Development Plan (\`task\_deps.md\`)

The comprehensive development plan has been created and is available in [\`task\_deps.md\`](./task\_deps.md). The plan includes:

- \*\*7-Phase Structure:\*\* From research through launch over 6 weeks
- \*\*Risk Mitigation Strategy:\*\* Addressing single points of failure and technical risks
- \*\*Complex Area Focus:\*\* Special attention to unified input interface, progressive error recovery, and performance optimization
- \*\*Team Allocation:\*\* 3 parallel work streams with defined skill requirements
- \*\*Quality Gates:\*\* Phase-based milestones with clear success criteria

Key highlights include Phase 0 alternative library research to mitigate rembg dependency risk, and the comprehensive unified input system architecture to deliver the frictionless workflow experience.

---

### 14. Latest Rembg Implementation Patterns (2025)

**Enhanced Model Support**

* **Primary Model:** `isnet-general-use` - Optimized for general use cases including AI-generated characters
* **High-Quality Alternative:** `birefnet-general` - Better edge detection for complex characters
* **Fallback Model:** `u2net` - Reliable baseline with broad compatibility
* **Specialized Model:** `sam` (Segment Anything Model) - Supports input points for precise segmentation

**Performance Optimization Patterns**

```python
# Session reuse pattern for serverless optimization
from rembg import new_session, remove

# Global session initialization (once per function instance)
REMBG_SESSION = new_session("isnet-general-use")

def lambda_handler(event, context):
    image_data = get_image_from_event(event)
    
    # Process with session reuse
    result = remove(
        image_data,
        session=REMBG_SESSION,
        force_return_bytes=True  # Consistent response type
    )
    
    return {
        'statusCode': 200,
        'body': base64.b64encode(result).decode(),
        'headers': {'Content-Type': 'image/png'}
    }
```

**Advanced Processing Options**

```python
# Alpha matting for Edge Enchantment feature
def enhanced_processing(image_data):
    return remove(
        image_data,
        session=REMBG_SESSION,
        alpha_matting=True,
        alpha_matting_foreground_threshold=270,
        alpha_matting_background_threshold=20,
        alpha_matting_erode_size=11,
        force_return_bytes=True
    )

# Background color replacement
def background_replacement(image_data, bg_color=(255, 255, 255, 255)):
    return remove(
        image_data,
        session=REMBG_SESSION,
        bgcolor=bg_color,
        force_return_bytes=True
    )

# Mask-only generation for advanced workflows
def generate_mask_only(image_data):
    return remove(
        image_data,
        session=REMBG_SESSION,
        only_mask=True,
        force_return_bytes=True
    )
```

**Error Recovery Implementation**

```python
# Progressive model fallback for reliability
FALLBACK_MODELS = ["isnet-general-use", "u2net", "birefnet-general"]

def process_with_fallback(image_data):
    for model_name in FALLBACK_MODELS:
        try:
            session = new_session(model_name)
            return remove(
                image_data,
                session=session,
                force_return_bytes=True
            )
        except Exception as e:
            logger.warning(f"Model {model_name} failed: {e}")
            continue
    
    raise Exception("All models failed to process image")
```

**Batch Processing Optimization**

```python
# Efficient batch processing with session reuse
def batch_process_images(image_list):
    session = new_session("isnet-general-use")
    results = []
    
    for image_data in image_list:
        try:
            result = remove(
                image_data,
                session=session,
                force_return_bytes=True
            )
            results.append(result)
        except Exception as e:
            results.append(None)  # Handle individual failures
    
    return results
```

**Quality Assurance Patterns**

* **Processing Time Target:** <5 seconds end-to-end (including network overhead)
* **Memory Management:** Session reuse reduces model loading from ~2-3 seconds to <100ms
* **Response Consistency:** `force_return_bytes=True` ensures predictable API responses
* **Error Handling:** Progressive model fallback with detailed logging for troubleshooting

