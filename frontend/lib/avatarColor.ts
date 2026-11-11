// =============================================================================
// File: lib/avatarColor.ts
// Purpose: Picks a stable avatar colour for a person who has no stored colour (meeting
//          participants, who may be guests without an account).
// Contains: getAvatarColorForName
// =============================================================================

// Colours that look good behind white text (the first one is Zoom's default purple).
const AVATAR_COLORS = ["#a94bc0", "#0b5cff", "#e8590c", "#2f9e44", "#1098ad", "#d6336c", "#5f3dc4", "#e67700"];

// Purpose: The same name always gets the same colour.
// Input:   name - a display name
// Output:  a hex colour from AVATAR_COLORS
// How it works: adds up the character codes of the name and uses the remainder after dividing
//   by the number of colours as the index.
export function getAvatarColorForName(name: string): string {
  let total = 0;
  for (const character of name) {
    total += character.charCodeAt(0);
  }
  return AVATAR_COLORS[total % AVATAR_COLORS.length];
}
