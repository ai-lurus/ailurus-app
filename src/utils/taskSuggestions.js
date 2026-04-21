function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/-$/, '')
}

export function suggestBranchAndPr(task) {
  const slug = slugify(task.title)
  const isFix = /\b(fix|bug|error|issue|patch|corregir|arreglar)\b/i.test(task.title)

  let prefix
  if (task.category === 'design') prefix = 'design'
  else if (task.category === 'marketing') prefix = 'marketing'
  else if (isFix) prefix = 'fix'
  else prefix = 'feat'

  return {
    branch: `${prefix}/${slug}`,
    prTitle: `${prefix}: ${task.title}`,
  }
}
