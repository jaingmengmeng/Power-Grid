using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class line : MonoBehaviour
{
    // Start is called before the first frame update
    void Start()
    {

    }

    void DrawLS(GameObject startP, GameObject finalP)
    {
        Vector3 rightPosition = (startP.transform.position + finalP.transform.position) / 2;
        Vector3 rightRotation = finalP.transform.position - startP.transform.position;
        float HalfLength = Vector3.Distance(startP.transform.position, finalP.transform.position) / 2;
        float LThickness = 0.1f;//线的粗细

        //创建圆柱体
        GameObject MyLine = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        MyLine.gameObject.transform.parent = transform;
        MyLine.transform.position = rightPosition;
        MyLine.transform.rotation = Quaternion.FromToRotation(Vector3.up, rightRotation);
        MyLine.transform.localScale = new Vector3(LThickness, HalfLength, LThickness);

        //这里可以设置材质，具体自己设置
        //MyLine.GetComponent<MeshRenderer>().material = GetComponent<MeshRenderer>().material;
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
