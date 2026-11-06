/* Shared class strings for the admin. Same look as the sign-in page: stone neutrals, Inter, white cards. */

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900";

export const input =
  "block w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-900 shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 aria-invalid:border-red-600 aria-invalid:focus:ring-red-600/15 disabled:bg-stone-50 disabled:text-stone-500 sm:text-sm";

export const textInput = `${input} h-11 sm:h-10`;

export const textarea = `${input} py-2.5 leading-relaxed [field-sizing:content]`;

export const label = "block text-sm font-medium text-stone-800";

export const hint = "text-sm text-stone-500";

export const fieldError = "text-sm text-red-700";

const buttonBase = `inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const buttonPrimary = `${buttonBase} h-10 bg-stone-900 text-white hover:bg-stone-800`;

export const buttonSecondary = `${buttonBase} h-10 border border-stone-300 bg-white text-stone-900 shadow-xs hover:bg-stone-50`;

export const buttonGhost = `${buttonBase} h-10 text-stone-700 hover:bg-stone-100 hover:text-stone-900`;

export const buttonDanger = `${buttonBase} h-10 bg-red-700 text-white hover:bg-red-800`;

export const iconButton = `inline-grid size-10 shrink-0 place-items-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const card = "rounded-2xl border border-stone-200 bg-white shadow-xs";
