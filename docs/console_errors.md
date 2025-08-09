analytics.ts:80 📊 Analytics Event: {event_type: 'session_start', session_hash: 'session_6wx2v4', timestamp: '2025-08-08T12:08:13.109Z', data: {…}}
UnifiedInput.svelte:32 🔍 UnifiedInput component mounted
UnifiedInput.svelte:36 🔍 Clipboard supported: true
analytics.ts:80 📊 Analytics Event: {event_type: 'unique_session', session_hash: 'session_6wx2v4', timestamp: '2025-08-08T12:08:13.152Z', data: {…}}
// Enhanced Container Identification Script
// Copy and paste this into browser console to identify which containers are off-center

console.log('🔍 IDENTIFYING OFF-CENTER CONTAINERS');
console.log('===================================');

const containers = document.querySelectorAll('.container');
console.log(`Found ${containers.length} container elements\n`);

containers.forEach((container, i) => {
  const rect = container.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const viewportCenterX = window.innerWidth / 2;
  const offset = Math.abs(centerX - viewportCenterX);
  
  // Get container identification info
  const parent = container.parentElement;
  const parentClass = parent ? parent.className : 'no parent';
  const parentTag = parent ? parent.tagName.toLowerCase() : 'no parent';
  const containerClasses = container.className;
  const containerText = container.innerText.substring(0, 50) + '...';
  
  console.log(`\n📦 CONTAINER ${i + 1}:`);
  console.log(`   Offset: ${offset.toFixed(1)}px ${offset < 5 ? '✅ CENTERED' : '❌ OFF-CENTER'}`);
  console.log(`   Classes: "${containerClasses}"`);
  console.log(`   Parent: <${parentTag} class="${parentClass}">`);
  console.log(`   Content preview: "${containerText.trim()}"`);
  console.log(`   Position: left=${rect.left.toFixed(1)}px, width=${rect.width.toFixed(1)}px`);
  
  // Add visual indicator
  if (offset < 5) {
    container.style.outline = '3px solid green';
    container.style.outlineOffset = '2px';
  } else {
    container.style.outline = '3px solid red';
    container.style.outlineOffset = '2px';
  }
  
  // Add label
  const label = document.createElement('div');
  label.innerHTML = `Container ${i + 1}<br/>${offset.toFixed(1)}px offset`;
  label.style.cssText = `
    position: absolute;
    top: ${rect.top + window.scrollY - 30}px;
    left: ${rect.left}px;
    background: ${offset < 5 ? 'green' : 'red'};
    color: white;
    padding: 4px 8px;
    font-size: 12px;
    z-index: 9999;
    border-radius: 4px;
    font-family: monospace;
    line-height: 1.2;
  `;
  document.body.appendChild(label);
});

console.log('\n🎯 SUMMARY:');
console.log('Green outline + label = Centered containers');
console.log('Red outline + label = Off-center containers');
console.log('Look for the consistent 61.5px offset pattern!');
VM28602:4 🔍 IDENTIFYING OFF-CENTER CONTAINERS
VM28602:5 ===================================
VM28602:8 Found 5 container elements

VM28602:23 
📦 CONTAINER 1:
VM28602:24    Offset: 3.7px ✅ CENTERED
VM28602:25    Classes: "container mx-auto px-4 py-4 s-7IPF32Wcq3s8"
VM28602:26    Parent: <header class="border-b border-dark-border bg-dark-surface/50 backdrop-blur-sm sticky top-0 z-50 s-7IPF32Wcq3s8">
VM28602:27    Content preview: "CharacterCut

R&D Initiative

System Online..."
VM28602:28    Position: left=0.0px, width=883.6px
VM28602:23 
📦 CONTAINER 2:
VM28602:24    Offset: 61.5px ❌ OFF-CENTER
VM28602:25    Classes: "container text-center s-y_bCXRrkrYfP"
VM28602:26    Parent: <section class="hero py-12 sm:py-20 s-y_bCXRrkrYfP">
VM28602:27    Content preview: "Transform Characters
with Magic

Watch backgrounds..."
VM28602:28    Position: left=0.0px, width=768.0px
VM28602:23 
📦 CONTAINER 3:
VM28602:24    Offset: 61.5px ❌ OFF-CENTER
VM28602:25    Classes: "container s-y_bCXRrkrYfP"
VM28602:26    Parent: <section class="interface py-8 s-y_bCXRrkrYfP">
VM28602:27    Content preview: "Place Character Here

Watch backgrounds disappear ..."
VM28602:28    Position: left=0.0px, width=768.0px
VM28602:23 
📦 CONTAINER 4:
VM28602:24    Offset: 61.5px ❌ OFF-CENTER
VM28602:25    Classes: "container s-y_bCXRrkrYfP"
VM28602:26    Parent: <section class="features py-16 sm:py-24 s-y_bCXRrkrYfP">
VM28602:27    Content preview: "Built for Developer Workflow

Designed for speed a..."
VM28602:28    Position: left=0.0px, width=768.0px
VM28602:23 
📦 CONTAINER 5:
VM28602:24    Offset: 3.7px ✅ CENTERED
VM28602:25    Classes: "container mx-auto px-4 py-6 s-7IPF32Wcq3s8"
VM28602:26    Parent: <footer class="border-t border-dark-border bg-dark-surface/30 mt-auto s-7IPF32Wcq3s8">
VM28602:27    Content preview: "© 2025 CharacterCut. Research & Development Initia..."
VM28602:28    Position: left=0.0px, width=883.6px
VM28602:58 
🎯 SUMMARY:
VM28602:59 Green outline + label = Centered containers
VM28602:60 Red outline + label = Off-center containers
VM28602:61 Look for the consistent 61.5px offset pattern!
undefined
