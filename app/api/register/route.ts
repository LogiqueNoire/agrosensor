import { handleRegistrationRequest } from '@/lib/registration-handler'

export async function POST(request: Request) {
  return handleRegistrationRequest(request)
}
