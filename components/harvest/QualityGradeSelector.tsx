import {
  QUALITY_GRADES,
  type QualityGrade,
} from "@/lib/contracts/harvest.contract";
import { FieldValidationFeedback } from "@/components/harvest/FieldValidationFeedback";

const GRADE_NOTES: Record<QualityGrade, string> = {
  "Grade A":
    "Sound bulbs. Indicative APMC prices are published for this grade.",
  "Grade B": "Mixed lot. The evidence register has no Grade B price benchmark.",
  "Grade C":
    "Higher damage. The evidence register has no Grade C price benchmark.",
};

export function QualityGradeSelector({
  value,
  error,
  onChange,
  onBlur,
}: {
  value: string;
  error?: string;
  onChange: (grade: QualityGrade) => void;
  onBlur: () => void;
}) {
  return (
    <fieldset
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? "declaredQualityGrade-error" : undefined}
    >
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-charcoal-700 dark:text-linen-300">
        Declared quality grade
      </legend>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {QUALITY_GRADES.map((grade) => {
          const isSelected = value === grade;
          return (
            <label
              key={grade}
              className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                isSelected
                  ? "border-terracotta bg-terracotta-50/50 dark:border-terracotta-600 dark:bg-terracotta-950/20"
                  : "border-sand-300 bg-white hover:border-sand-400 dark:border-charcoal-700 dark:bg-charcoal-850 dark:hover:border-charcoal-600"
              }`}
            >
              <input
                id={`declaredQualityGrade-${grade}`}
                type="radio"
                name="declaredQualityGrade"
                value={grade}
                checked={isSelected}
                onChange={() => onChange(grade)}
                onBlur={onBlur}
                className="mt-1 h-4 w-4 shrink-0 accent-terracotta"
              />
              <span className="min-w-0 space-y-0.5">
                <span className="block text-sm font-semibold text-charcoal-900 dark:text-linen-100">
                  {grade}
                </span>
                <span className="block text-xs leading-5 text-charcoal-500 dark:text-linen-400">
                  {GRADE_NOTES[grade]}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <FieldValidationFeedback
        id="declaredQualityGrade-error"
        message={error}
      />
    </fieldset>
  );
}
