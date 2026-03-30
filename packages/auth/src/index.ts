export type Session = {
  userId: string
  username: string
  fullName: string
  organizationId: string
  sDM_NhanVienId: string
  sDM_DonViId: string
}

export type SessionStatus = "authenticated" | "unauthenticated" | "loading"
