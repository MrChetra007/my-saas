<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">🍽️ RestaurantOS</h1>
        <p class="text-gray-500 mt-1 text-sm">Restaurant management, simplified</p>
      </div>

      <!-- Slot (Login or Signup form goes here) -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <slot />
      </div>
    </div>
  </div>
</template>
