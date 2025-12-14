import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const profiles = await prisma.userProfile.findMany({
    where: {
        bLaGiangVien: true,
        lecturer: null,
        sDM_DonViId: { not: null },
    },
})

const orgs = await prisma.dM_DonVi.findMany({
  select:{Id:true}
})

const missingOrgs = profiles.map((profile) => profile.sDM_DonViId).filter(id => !orgs.find(org => org.Id === id))
console.log(missingOrgs);


await prisma.lecturer.createMany({
    data: profiles.map((profile) => {
      console.log(profile.sDM_DonViId);
      
      return ({
        userProfileId: profile.id,
        code: profile.code,
        lecturerTypeId: 'cmhlda9w0000g1ynzifel7n1t',
        organizationId: profile.sDM_DonViId as string,
    })
    }),
})

