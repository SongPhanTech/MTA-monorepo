const q = {
  include: {
    subjectVersions: {
      select: {
        subjectClass: {
          where: {
            semester: { id: "cmhlen038000qp001xn63yke3" },
            subject: {
              planTrainingSubject: {
                some: {
                  planTraining: {
                    semesterId: "cmhlen038000qp001xn63yke3",
                    trainingObjectTypeId: "550e8402-e29b-41d4-a716-446655440000",
                  },
                },
              },
            },
            deletedAt: null,
            active: true,
            trainingObjectTypeId: "550e8402-e29b-41d4-a716-446655440000",
            type: "NORMAL",
          },
          include: {
            semester: true,
            mainLecturer: { include: { userProfile: true } },
            subject: { include: { managementOrganization: true } },
            extraLecturer: { include: { userProfile: true } },
            enterGradeLecturer: { include: { userProfile: true } },
            room: true,
            trainingLocation: true,
            subjectClassStudent: true,
            subjectClassTimes: true,
            fixedClasses: {
              select: {
                code: true,
                _count: {
                  select: {
                    students: {
                      where: {
                        deletedAt: null,
                        active: true,
                        status: "ENROLLED",
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: [{ code: "asc" }],
        },
      },
    },
  },
  // take: 10,
  // skip: 0,
  where: {
    bActive: true,
    subjectVersions: {
      some: {
        // subjectClass: {
        //     some: {
        //         // semester: { id: 'cmhlen038000qp001xn63yke3' },
        //         // subject: {
        //         //     planTrainingSubject: {
        //         //         some: {
        //         //             planTraining: {
        //         //                 semesterId: 'cmhlen038000qp001xn63yke3',
        //         //                 trainingObjectTypeId:
        //         //                     '550e8402-e29b-41d4-a716-446655440000',
        //         //             },
        //         //         },
        //         //     },
        //         // },
        //         // deletedAt: null,
        //         // active: true,
        //         // trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440000',
        //         // type: 'NORMAL',
        //     },
        // },
      },
    },
  },
}

const res = await fetch(
  `https://api.model.mta.swantech.vn/api/model/dM_DonVi/findMany?q=${JSON.stringify(q)}`,
  {
    method: "GET",
    mode: "cors",
  }
)

const data = await res.json()
console.log(data.data.length)
