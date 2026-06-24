# Console icon set — solid variant + semantic mapping

All single-color UI line icons were converted to **Heroicons v2 — Solid (24×24)**.
Path data is extracted **deterministically from the installed `@heroicons/react@2.2.0`
package** (`24/solid/esm/*Icon.js`) — never hand-written, so every glyph is the exact
upstream shape. Format per file:

```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="...">
  <path fill-rule="evenodd" d="…" clip-rule="evenodd"/>
</svg>
```

## What is / isn't solid

| Group | Treatment | Why |
|-------|-----------|-----|
| 78 single-color UI icons | **Solid** | the bold, uniform look requested |
| ~9 dense-UI structural (`back`, `more`, `plus`, `minus`, `clear`, `clear-input`, `circle-minus`, `draggable`, `keyboard-arrow-up`) | **Left outline** | repeated in tables / nav / inputs — solid here = visual clutter |
| ~22 multicolor spot illustrations (`members-bg`, `tada`, `social`, `*-feature`, `*-header`, `passwordless`, `connector-sms`, `single-page-app`, `tools`, `private-cloud`, `check-demo`) | **Untouched** | these are illustrations, not line icons |
| ~37 brand / connector / logo marks | **Untouched** | identity art, never restyle |

## Best icon per item (filename → Heroicon solid)

### Resources & objects
| Item | Heroicon |
|------|----------|
| api-resource | ServerStack |
| machine-to-machine | CpuChip |
| create-app | Squares2X2 |
| native-app / mobile | DevicePhoneMobile |
| cube | Cube |
| database | CircleStack |
| card | CreditCard |
| building | BuildingOffice2 |
| briefcase / case | Briefcase |

### Users & access
| Item | Heroicon |
|------|----------|
| user | User |
| members | UserGroup |
| create-role | UserPlus |
| contact | Identification |
| invitation | EnvelopeOpen |
| key / factor-backup-code | Key |
| lock | LockClosed |
| unlock | LockOpen |
| factor-webauthn | FingerPrint |
| factor-totp | Clock |
| factor-phone | DevicePhoneMobile |

### Communication
| Item | Heroicon |
|------|----------|
| email / mail / envelop / email-us / factor-email | Envelope |
| email-sent | EnvelopeOpen |
| contact-us | ChatBubbleLeftRight |

### Content & files
| Item | Heroicon |
|------|----------|
| document | DocumentText |
| file / file-icon | Document |
| book / further-readings | BookOpen |
| label | Tag |
| download | ArrowDownTray |
| upload | ArrowUpTray |
| cloud-upload | CloudArrowUp |
| cloud / cloud-icon | Cloud |

### Form field-type hints
| Item | Heroicon |
|------|----------|
| field-type-text | Bars3BottomLeft |
| field-type-number | Hashtag |
| field-type-date | CalendarDays |
| field-type-dropdown | ArrowDownCircle |
| field-type-checkbox | CheckCircle |
| field-type-url | Link |
| field-type-regex | CodeBracket |

### Status & feedback
| Item | Heroicon |
|------|----------|
| toast-success | CheckCircle |
| toast-error | ExclamationCircle |

### Misc / decorative
| Item | Heroicon |
|------|----------|
| bulb / light-bulb / tip | LightBulb |
| lightening | Bolt |
| sparkles / tada | Sparkles |
| gift | Gift |
| globe | GlobeAlt |
| calendar / calendar-outline | Calendar |
| customize | AdjustmentsHorizontal |
| palette | Swatch |
| moon | Moon |
| conical-flask | Beaker |
| get-started | RocketLaunch |
| get-sample | CodeBracket |
| password-hide | EyeSlash |

## Regenerating

To re-extract (e.g. after a Heroicons bump), the source of truth is the package:
`node_modules/.pnpm/@heroicons+react@*/node_modules/@heroicons/react/24/solid/esm/<Name>Icon.js`.
Pull the `<path>` props verbatim into the `fill="currentColor"` wrapper above.
