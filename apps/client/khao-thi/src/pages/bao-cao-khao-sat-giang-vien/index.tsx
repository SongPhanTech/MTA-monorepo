import Select from "@components/commons/select";
import TreeSelect from "@components/commons/tree-select";
import DefaultLayout from "@layouts/default-layout";
import { buildOrgTree } from "@lib/utils";
import {
  useFindManyClusterSurvey,
  useFindManyDM_DonVi,
} from "@workspace/db/hooks";
import { Button, Col, Flex, Row } from "antd";
import { useMemo, useState } from "react";
import OrganizationSurveyReport from "@/components/sub-pages/khao-sat/bao-cao-don-vi";
import ClusterSurveyReport from "@components/sub-pages/khao-sat/bao-cao-cum";

export default function BaoCaoGiangVien() {
  const [filters, setFilters] = useState<any>({
    name: "",
    surveyId: undefined,
    organizationId: undefined,
    semesterIds: undefined,
    clusterId: undefined,
  });

  const [filtersMore, setFiltersMore] = useState<any>({
    name: "",
    surveyId: undefined,
    organizationId: undefined,
    semesterIds: undefined,
    clusterId: undefined,
  });

  const { data = [], refetch } = useFindManyClusterSurvey({
    where: {},
    include: {
      surveyObjectType: true,
      surveyTopic: true,
      surveyQuestion: true,
      surveys: {
        include: {
          surveySessions: true,
          subjectClass: {
            include: {
              semester: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const { data: organizations = [] } = useFindManyDM_DonVi();
  const treeData = buildOrgTree(organizations);

  const hanleSearchReport = () => {
    setFiltersMore(filters);
  };

  const items = useMemo(() => {
    if (!filtersMore?.clusterId) {
      return (
        <div className="my-10 text-center text-primary text-base">
          Chọn đợt khảo sát
        </div>
      );
    }
    if (filtersMore?.clusterId) {
      if (filtersMore.organizationId) {
        if (filtersMore.surveyId) {
          return;
        }
        return (
          <ClusterSurveyReport
            selectedId={filtersMore?.clusterId}
            surveyName={filtersMore?.name}
            surveyId={filters?.surveyId}
            setSurvey={(value) => {
              setFilters(value);
            }}
            organizationSelected={filters?.organizationId}
          />
        );
      }
      return (
        <OrganizationSurveyReport
          selectedId={filtersMore?.clusterId}
          surveyName={filtersMore?.name}
          organizationSelected={filters?.organizationId}
          setOrganizationSelected={(value) => {
            setFilters({ ...filters, organizationId: value });
          }}
        />
      );
    }
    return;
  }, [filtersMore]);
  return (
    <Row gutter={[16, 4]}>
      <Col span={24}>
        <Flex justify="space-between">
          <Flex>
            <Select
              onChange={(value) => setFilters({ ...filters, clusterId: value })}
              className="mr-4 w-[250px]"
              options={data.map((i) => {
                return {
                  label: i.name,
                  value: i.id,
                };
              })}
              placeholder="Chọn đợt khảo sát"
            />
            <TreeSelect
              allowClear
              showSearch
              placeholder="Chọn đơn vị quản lý"
              treeDefaultExpandAll
              treeData={treeData}
              value={filters.organizationId}
              className="mr-4 w-[250px]"
              onChange={(value) =>
                setFilters({ ...filters, organizationId: value })
              }
            />
          </Flex>
          <Button onClick={hanleSearchReport} type="primary">
            Tìm kiếm
          </Button>
        </Flex>
      </Col>
      <Col span={24}>{items}</Col>
    </Row>
  );
}
BaoCaoGiangVien.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
