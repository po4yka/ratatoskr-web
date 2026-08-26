import type { ReaderPreferences } from "@/features/reader/reader-preferences"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ReaderSettingsProps {
  preferences: ReaderPreferences
  onChange: (preferences: ReaderPreferences) => void
}

const choices: {
  [Key in keyof ReaderPreferences]: readonly [ReaderPreferences[Key], string][]
} = {
  fontScale: [
    ["default", "Standard"],
    ["large", "Large"],
    ["xlarge", "Extra large"],
  ],
  lineHeight: [
    ["comfortable", "Comfortable"],
    ["relaxed", "Relaxed"],
  ],
  measure: [
    ["comfortable", "Comfortable"],
    ["narrow", "Narrow"],
  ],
  theme: [
    ["system", "System"],
    ["sepia", "Sepia"],
  ],
  fontFamily: [
    ["geist", "Geist"],
    ["serif", "Serif"],
  ],
}

export function ReaderSettings({ preferences, onChange }: ReaderSettingsProps) {
  function update<Key extends keyof ReaderPreferences>(
    key: Key,
    value: ReaderPreferences[Key]
  ) {
    onChange({ ...preferences, [key]: value })
  }

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline">Reading settings</Button>}
      />
      <PopoverContent className="w-72 rounded-xl p-5" side="bottom">
        <PopoverHeader>
          <PopoverTitle>Reading settings</PopoverTitle>
        </PopoverHeader>
        {(Object.keys(choices) as (keyof ReaderPreferences)[]).map((key) => (
          <label className="flex flex-col gap-1.5 text-body" key={key}>
            {labelFor(key)}
            <select
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-body outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onChange={(event) => update(key, event.target.value as never)}
              value={preferences[key]}
            >
              {choices[key].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function labelFor(key: keyof ReaderPreferences): string {
  return {
    fontScale: "Font size",
    lineHeight: "Line height",
    measure: "Line width",
    theme: "Theme",
    fontFamily: "Font family",
  }[key]
}
