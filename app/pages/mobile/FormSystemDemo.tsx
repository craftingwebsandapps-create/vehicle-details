import { useState } from "react"
import { toast } from "sonner"

import { FormBuilder } from "~/components/form"
import { siteFormConfig, type SiteFormValues } from "~/schemas/site-form-config"

export default function FormSystemDemo() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (values: SiteFormValues) => {
    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 900))
      console.log("Submitted payload", values)
      toast.success("Form submitted successfully", { position: "top-center" })
    } catch {
      toast.error("Submission failed", { position: "top-center" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enterprise-grade dynamic form builder demo
      </p>
      <FormBuilder
        config={siteFormConfig}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        persistenceKey="form-demo-site"
        role="ADMIN"
      />
    </div>
  )
}
