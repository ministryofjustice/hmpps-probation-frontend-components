import nunjucks from 'nunjucks'
import RequestOptions from '../types/RequestOptions'
import { HmppsUser } from '../types/HmppsUser'

export function getFallbackHeader(user: HmppsUser | null, requestOptions: RequestOptions): string {
  const { pdsUrl, environmentName } = requestOptions

  return nunjucks.render('pdsComponents/header.njk', {
    pdsUrl,
    environmentName,
    user,
    name: initialiseName(user?.displayName),
  })
}

export function getFallbackFooter(): string {
  return nunjucks.render('pdsComponents/footer.njk')
}

function initialiseName(fullName?: string): string | null {
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}
