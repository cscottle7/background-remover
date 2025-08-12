<!--
  REDIRECT PAGE - /refine now redirects to SEO-friendly /refine-image
  This ensures backward compatibility for any existing bookmarks or links
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  
  onMount(async () => {
    if (!browser) return;
    
    // Get current URL parameters to preserve them
    const currentUrl = $page.url;
    const searchParams = currentUrl.searchParams.toString();
    
    // Redirect to new SEO-friendly URL with preserved parameters
    const redirectUrl = searchParams 
      ? `/refine-image?${searchParams}`
      : '/refine-image';
    
    console.log('🔄 Redirecting from /refine to /refine-image:', redirectUrl);
    
    // Use replace to avoid adding to browser history
    await goto(redirectUrl, { replaceState: true });
  });
</script>

<svelte:head>
  <title>Redirecting... - CharacterCut</title>
  <meta name="description" content="Redirecting to image refinement tools" />
</svelte:head>

<!-- Simple loading state while redirecting -->
<div class="flex items-center justify-center min-h-screen">
  <div class="text-center">
    <div class="w-8 h-8 mx-auto mb-4 border-2 border-magic-400/20 border-t-magic-400 rounded-full animate-spin"></div>
    <p class="text-dark-text-secondary">Redirecting to image refinement...</p>
  </div>
</div>