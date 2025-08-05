import GeneratedContractsList from "@/components/rental/GeneratedContractsList";

const GeneratedContracts = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">العقود المنشأة</h1>
        <p className="text-muted-foreground mt-1">
          إدارة ومتابعة العقود المولدة والمحفوظة في النظام
        </p>
      </div>
      
      <GeneratedContractsList />
    </div>
  );
};

export default GeneratedContracts;