// src/lib/getCurrentUser.js

export function getCurrentUser() {
  try {
    const saved = localStorage.getItem("user");
    if (!saved) return "Unknown User";

    const user = JSON.parse(saved);

    if (user.firstname && user.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }

    // fallback options
    if (user.firstname) return user.firstname;
    if (user.email) return user.email;
    return "Unknown User";
  } catch (error) {
    console.error("Error reading user from localStorage:", error);
    return "Unknown User";
  }
}
