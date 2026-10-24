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
      <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
        Declared quality grade
      </legend>
      <div className="space-y-2">
        {QUALITY_GRADES.map((grade) => (
          <label
            key={grade}
            className="flex cursor-pointer gap-3 rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700"
          >
            <input
              id={`declaredQualityGrade-${grade}`}
              type="radio"
              name="declaredQualityGrade"
              value={grade}
              checked={value === grade}
              onChange={() => onChange(grade)}
              onBlur={onBlur}
              className="mt-1 h-4 w-4 accent-emerald-700"
            />
            <span>
              <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                {grade}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {GRADE_NOTES[grade]}
              </span>
            </span>
          </label>
        ))}
      </div>
      <FieldValidationFeedback
        id="declaredQualityGrade-error"
        message={error}
      />
    </fieldset>
  );
}
